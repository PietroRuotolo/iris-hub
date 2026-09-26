import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'

// Rotas de calibrações e sessões contra um MongoDB real (em memória). O Prisma exige replica set.
let mongo: MongoMemoryReplSet
let app: INestApplication

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  process.env.MONGO_URI = mongo.getUri('iris-teste')
  process.env.LOG_LEVEL = 'error'
  // Importado depois de definir MONGO_URI: o módulo lê o ambiente ao ser carregado.
  const { AppModule } = await import('../src/app.module.js')
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(async () => {
  await app?.close()
  await mongo?.stop()
})

const calibracaoValida = { pontosCalibracao: 9, erroMedioPx: 42.5, erroMedioFracaoTela: 0.05, tela: { larguraPx: 1366, alturaPx: 768 } }

describe('calibrações e sessões (e2e)', () => {
  it('fluxo completo: calibração → sessão → finalizar → resumo', async () => {
    const http = request(app.getHttpServer())

    const calibracao = await http.post('/calibrations').send(calibracaoValida).expect(201)
    expect(calibracao.body).toMatchObject({ pontosCalibracao: 9, participanteId: null, tela: { larguraPx: 1366 } })

    const sessao = await http.post('/sessions').send({ calibracaoId: calibracao.body.id }).expect(201)
    expect(sessao.body).toMatchObject({ status: 'em-andamento', concluidaEm: null, totalEventos: 0 })

    await http.get(`/sessions/${sessao.body.id}/summary`).expect(409)

    const eventos = [
      { tipo: 'acerto', instanteMs: 500, tempoRespostaMs: 300, precisaoPx: 20 },
      { tipo: 'erro', instanteMs: 1500 },
    ]
    const concluida = await http.post(`/sessions/${sessao.body.id}/finish`).send({ eventos }).expect(200)
    expect(concluida.body).toMatchObject({ status: 'concluida', totalEventos: 2 })

    const resumo = await http.get(`/sessions/${sessao.body.id}/summary`).expect(200)
    expect(resumo.body).toMatchObject({ sessaoId: sessao.body.id, acertos: 1, erros: 1, taxaAcerto: 0.5, precisaoMediaPx: 20 })

    await http.post(`/sessions/${sessao.body.id}/finish`).send({ eventos }).expect(409)
    await http.get(`/sessions/${sessao.body.id}`).expect(200)
  })

  it('valida os dados de entrada com mensagens por campo', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/sessions')
      .send({ calibracaoId: 'nao-e-um-id', extra: 1 })
      .expect(400)
    expect(resposta.body).toMatchObject({ status: 400, erro: 'Dados inválidos', caminho: '/sessions' })
    expect(resposta.body.detalhes).toEqual(
      expect.arrayContaining([expect.stringMatching(/^calibracaoId:/), expect.stringMatching(/^extra:/)]),
    )

    const eventoInvalido = await request(app.getHttpServer())
      .post('/calibrations')
      .send({ ...calibracaoValida, tela: { larguraPx: 0 } })
      .expect(400)
    expect(eventoInvalido.body.detalhes).toEqual(expect.arrayContaining([expect.stringMatching(/^tela\.larguraPx:/)]))
  })

  it('404 para calibração ou sessão inexistente', async () => {
    const http = request(app.getHttpServer())
    await http.post('/sessions').send({ calibracaoId: '64b000000000000000000000' }).expect(404)
    const resposta = await http.get('/sessions/64b000000000000000000000').expect(404)
    expect(resposta.body.erro).toBe('Não encontrado: Sessão 64b000000000000000000000')
    await http.get('/health').expect(200, { status: 'ok', servico: 'session-service' })
  })
})
