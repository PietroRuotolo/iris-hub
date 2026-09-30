import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'

let mongo: MongoMemoryReplSet
let app: INestApplication

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  process.env.MONGO_URI = mongo.getUri('iris-teste-resumos')
  process.env.LOG_LEVEL = 'error'
  const { AppModule } = await import('../src/app.module.js')
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(async () => {
  await app?.close()
  await mongo?.stop()
})

describe('resumo compartilhado (e2e)', () => {
  it('sem partida encerrada não gera link; depois de jogar, o link abre as sessões da pessoa', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'resumo-dono'
    await http.post('/resumos').send({ participanteId, nome: 'Ana Souza' }).expect(409)

    // Uma partida de reflexo e uma de cores, encerradas.
    const r = await http.post('/sessions/reflexo').send({ participanteId }).expect(201)
    await http
      .post(`/sessions/reflexo/${r.body.id}/finish`)
      .send({ participanteId, status: 'CONCLUIDA', tentativas: [{ rodada: 1, tempoEsperaMs: 2000, tempoReacaoMs: 250, queimou: false, acionamento: 'ESP32_BUTTON' }] })
      .expect(200)
    const c = await http.post('/sessions/cores').send({ participanteId }).expect(201)
    await http
      .post(`/sessions/cores/${c.body.id}/finish`)
      .send({ participanteId, status: 'CONCLUIDA', pontuacaoFinal: 1, rodadas: [{ rodada: 1, tamanhoSequencia: 1, acertou: true, tempoRespostaMs: 800 }] })
      .expect(200)
    // Uma sessão de outra pessoa não pode entrar no resumo.
    await http.post('/sessions/reflexo').send({ participanteId: 'outra' }).expect(201)

    const criado = await http.post('/resumos').send({ participanteId, nome: 'Ana Souza' }).expect(201)
    expect(criado.body.sessoes).toEqual({ ritmo: null, reflexo: r.body.id, cores: c.body.id })

    const { body } = await http.get(`/resumos/${criado.body.token}`).expect(200)
    expect(body).toMatchObject({ nome: 'Ana', ritmo: null, reflexo: { id: r.body.id, tempoMedioMs: 250 }, cores: { id: c.body.id } })

    await http.get(`/resumos/${'z'.repeat(32)}`).expect(404)
  })
})
