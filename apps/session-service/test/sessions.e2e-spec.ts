import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'

let mongo: MongoMemoryReplSet
let app: INestApplication

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  process.env.MONGO_URI = mongo.getUri('iris-teste-sessoes')
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

const inicio = {
  participanteId: 'usuario-1',
  tela: { larguraPx: 1920, alturaPx: 1080, polegadas: 24, pxPorCm: 36.1 },
  calibracao: { pontos: 9, erroMedioPx: 80, qualidade: 0.8, coberturaValida: 0.95, distanciaMediaCm: 55, oculos: true, fracaoReflexo: 0.1, reflexoIgnorado: false },
}

const tentativa = (numeroAlvo: number, extra: Record<string, unknown> = {}) => ({
  numeroAlvo,
  alvoX: 0.5,
  alvoY: 0.5,
  raioPx: 50,
  janelaMs: 500,
  apresentadoEm: '2026-09-26T12:00:00.000Z',
  batidaEm: '2026-09-26T12:00:01.500Z',
  respostaEm: '2026-09-26T12:00:01.620Z',
  resultado: 'ACERTO',
  latenciaMs: 1620,
  erroTempoMs: 120,
  erroEspacial: 0.3,
  permanenciaMs: 300,
  cobertura: 1,
  desvioXPx: 12,
  desvioYPx: -8,
  ...extra,
})

describe('sessões do jogo (e2e)', () => {
  it('inicia, registra fases com pontos calculados no serviço e conclui', async () => {
    const http = request(app.getHttpServer())
    const criada = await http.post('/sessions').send(inicio).expect(201)
    expect(criada.body).toMatchObject({ status: 'EM_ANDAMENTO', fases: [], versaoPontuacao: 'v1', participanteId: 'usuario-1' })
    expect(criada.body.calibracao).toMatchObject({ distanciaMediaCm: 55, oculos: true, fracaoReflexo: 0.1, reflexoIgnorado: false })
    const id = criada.body.id as string

    const fase1 = await http
      .post(`/sessions/${id}/phases`)
      .send({
        participanteId: 'usuario-1',
        fase: 1,
        tentativas: [
          tentativa(1), // 86,8
          tentativa(2, { resultado: 'SEM_RESPOSTA', respostaEm: null, erroTempoMs: null, erroEspacial: null }), // 0
          tentativa(3, { resultado: 'RASTREAMENTO_INSUFICIENTE', cobertura: 0.2 }), // fora da média
        ],
      })
      .expect(200)
    expect(fase1.body.fases).toEqual([
      expect.objectContaining({ fase: 1, nome: 'Familiarização', acertos: 1, semResposta: 1, rastreamentoInsuficiente: 1, pontuacao: 43.4 }),
    ])
    expect(fase1.body.pontuacaoTotal).toBe(43.4)

    // a mesma fase de novo é conflito
    await http.post(`/sessions/${id}/phases`).send({ participanteId: 'usuario-1', fase: 1, tentativas: [tentativa(1)] }).expect(409)

    const fase2 = await http
      .post(`/sessions/${id}/phases`)
      .send({ participanteId: 'usuario-1', fase: 2, tentativas: [tentativa(1, { erroTempoMs: 0, erroEspacial: 0 })] })
      .expect(200)
    expect(fase2.body.pontuacaoTotal).toBe(71.7) // (43,4 + 100) / 2

    const concluida = await http.post(`/sessions/${id}/finish`).send({ participanteId: 'usuario-1', status: 'CONCLUIDA' }).expect(200)
    expect(concluida.body.status).toBe('CONCLUIDA')
    expect(concluida.body.concluidaEm).toEqual(expect.any(String))

    await http.post(`/sessions/${id}/finish`).send({ participanteId: 'usuario-1', status: 'CANCELADA' }).expect(409)
    await http.post(`/sessions/${id}/phases`).send({ participanteId: 'usuario-1', fase: 3, tentativas: [tentativa(1)] }).expect(409)
  })

  it('não mostra a sessão de outra pessoa e rejeita pontos enviados pelo site', async () => {
    const http = request(app.getHttpServer())
    const { body } = await http.post('/sessions').send(inicio).expect(201)

    await http.get(`/sessions/${body.id}`).query({ participanteId: 'outra-pessoa' }).expect(404)
    await http.get(`/sessions/${body.id}`).query({ participanteId: 'usuario-1' }).expect(200)

    const invalida = await http
      .post(`/sessions/${body.id}/phases`)
      .send({ participanteId: 'usuario-1', fase: 6, tentativas: [tentativa(1, { pontuacao: 100, alvoX: 2 })] })
      .expect(400)
    expect(invalida.body.detalhes).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^fase:/),
        expect.stringMatching(/^tentativas\.0\.pontuacao:/),
        expect.stringMatching(/^tentativas\.0\.alvoX:/),
      ]),
    )
  })
})
