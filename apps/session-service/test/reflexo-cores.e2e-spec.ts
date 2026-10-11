import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'

let mongo: MongoMemoryReplSet
let app: INestApplication

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  process.env.MONGO_URI = mongo.getUri('iris-teste-reflexo-cores')
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

const reacao = (rodada: number, tempoReacaoMs: number) => ({
  rodada,
  tempoEsperaMs: 3000,
  tempoReacaoMs,
  queimou: false,
  acionamento: 'ESP32_BUTTON',
})
const queimada = (rodada: number) => ({ rodada, tempoEsperaMs: 1200, tempoReacaoMs: null, queimou: true, acionamento: 'ESP32_BUTTON' })

describe('sessões do jogo de reflexo (e2e)', () => {
  it('inicia, conclui com o resumo recalculado no serviço e não deixa concluir de novo', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'reflexo-dono'
    const criada = await http.post('/sessions/reflexo').send({ participanteId }).expect(201)
    expect(criada.body).toMatchObject({ status: 'EM_ANDAMENTO', participanteId, tentativas: [], tempoMedioMs: null })

    const id = criada.body.id as string
    const fim = await http
      .post(`/sessions/reflexo/${id}/finish`)
      .send({ participanteId, status: 'CONCLUIDA', tentativas: [reacao(1, 300), reacao(2, 200), queimada(3)] })
      .expect(200)
    expect(fim.body).toMatchObject({ status: 'CONCLUIDA', tempoMedioMs: 250, melhorTempoMs: 200 })
    expect(fim.body.tentativas).toHaveLength(3)
    expect(fim.body.concluidaEm).toEqual(expect.any(String))

    await http.post(`/sessions/reflexo/${id}/finish`).send({ participanteId, status: 'CANCELADA', tentativas: [] }).expect(409)
  })

  it('GET /sessions/reflexo lista as sessões (não é confundida com GET /sessions/:id)', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'reflexo-lista'
    const a = await http.post('/sessions/reflexo').send({ participanteId }).expect(201)
    const b = await http.post('/sessions/reflexo').send({ participanteId }).expect(201)

    const { body } = await http.get('/sessions/reflexo').query({ participanteId }).expect(200)
    expect(body.map((s: { id: string }) => s.id)).toEqual([b.body.id, a.body.id]) // mais recente primeiro
    await http.get('/sessions/reflexo').query({ participanteId: 'ninguem' }).expect(200).expect([])
  })

  it('não mostra nem encerra a sessão de outra pessoa', async () => {
    const http = request(app.getHttpServer())
    const { body } = await http.post('/sessions/reflexo').send({ participanteId: 'dona' }).expect(201)

    await http.get(`/sessions/reflexo/${body.id}`).query({ participanteId: 'intrusa' }).expect(404)
    await http.get(`/sessions/reflexo/${body.id}`).expect(404) // sem participanteId
    await http
      .post(`/sessions/reflexo/${body.id}/finish`)
      .send({ participanteId: 'intrusa', status: 'CONCLUIDA', tentativas: [reacao(1, 250)] })
      .expect(404)
    await http.get(`/sessions/reflexo/${body.id}`).query({ participanteId: 'dona' }).expect(200)
  })

  it('cancelar sem nenhuma tentativa é válido; concluir sem tentativa não', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'reflexo-vazia'
    const a = await http.post('/sessions/reflexo').send({ participanteId }).expect(201)
    const vazia = await http.post(`/sessions/reflexo/${a.body.id}/finish`).send({ participanteId, status: 'CONCLUIDA', tentativas: [] }).expect(400)
    expect(vazia.body.detalhes).toEqual(expect.arrayContaining([expect.stringMatching(/^tentativas:/)]))

    await http.post(`/sessions/reflexo/${a.body.id}/finish`).send({ participanteId, status: 'CANCELADA', tentativas: [] }).expect(200)
  })

  it('rejeita tentativa incoerente, valores absurdos e métricas enviadas pelo site', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'reflexo-invalida'
    const { body } = await http.post('/sessions/reflexo').send({ participanteId }).expect(201)
    const finalizar = (corpo: Record<string, unknown>) =>
      http.post(`/sessions/reflexo/${body.id}/finish`).send({ participanteId, status: 'CONCLUIDA', ...corpo })

    // queimou, mas veio com tempo de reação
    const incoerente = await finalizar({ tentativas: [{ ...reacao(1, 200), queimou: true }] }).expect(400)
    expect(incoerente.body.detalhes).toEqual(expect.arrayContaining([expect.stringMatching(/^tentativas\.0\.tempoReacaoMs:/)]))
    // não queimou, mas sem tempo de reação
    await finalizar({ tentativas: [{ ...reacao(1, 200), tempoReacaoMs: null }] }).expect(400)
    // tempo negativo, acionamento desconhecido e tempo absurdo
    await finalizar({ tentativas: [reacao(1, -5)] }).expect(400)
    await finalizar({ tentativas: [{ ...reacao(1, 200), acionamento: 'TELEPATIA' }] }).expect(400)
    await finalizar({ tentativas: [reacao(1, 9_999_999)] }).expect(400)
    // média enviada pelo site: o serviço recalcula, então nem aceita o campo
    await finalizar({ tentativas: [reacao(1, 200)], tempoMedioMs: 1 }).expect(400)

    // nada disso encerrou a sessão: ainda dá para concluir direito
    await finalizar({ tentativas: [reacao(1, 200)] }).expect(200)
  })
})

const rodada = (numero: number, acertou: boolean, tempoRespostaMs: number | null = 1500) => ({
  rodada: numero,
  tamanhoSequencia: numero,
  acertou,
  tempoRespostaMs,
})

describe('sessões do jogo das cores (e2e)', () => {
  it('inicia e conclui com maior sequência e tempo médio recalculados no serviço', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'cores-dono'
    const criada = await http.post('/sessions/cores').send({ participanteId }).expect(201)
    expect(criada.body).toMatchObject({ status: 'EM_ANDAMENTO', participanteId, rodadas: [], maiorSequencia: null })

    const fim = await http
      .post(`/sessions/cores/${criada.body.id}/finish`)
      .send({ participanteId, status: 'CONCLUIDA', pontuacaoFinal: 2, rodadas: [rodada(1, true, 1000), rodada(2, true, 2000), rodada(3, false, 9000)] })
      .expect(200)
    expect(fim.body).toMatchObject({ status: 'CONCLUIDA', pontuacaoFinal: 2, maiorSequencia: 2, tempoRespostaMedioMs: 1500 })
    expect(fim.body.rodadas).toHaveLength(3)

    await http.post(`/sessions/cores/${criada.body.id}/finish`).send({ participanteId, status: 'CANCELADA', rodadas: [] }).expect(409)
  })

  it('GET /sessions/cores lista as sessões, isoladas por pessoa', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'cores-lista'
    const a = await http.post('/sessions/cores').send({ participanteId }).expect(201)
    const b = await http.post('/sessions/cores').send({ participanteId }).expect(201)

    const { body } = await http.get('/sessions/cores').query({ participanteId }).expect(200)
    expect(body.map((s: { id: string }) => s.id)).toEqual([b.body.id, a.body.id])
    await http.get('/sessions/cores').query({ participanteId: 'ninguem' }).expect(200).expect([])
  })

  it('não mostra nem encerra a sessão de outra pessoa', async () => {
    const http = request(app.getHttpServer())
    const { body } = await http.post('/sessions/cores').send({ participanteId: 'dona' }).expect(201)
    await http.get(`/sessions/cores/${body.id}`).query({ participanteId: 'intrusa' }).expect(404)
    await http
      .post(`/sessions/cores/${body.id}/finish`)
      .send({ participanteId: 'intrusa', status: 'CONCLUIDA', rodadas: [rodada(1, true)] })
      .expect(404)
  })

  it('rejeita rodadas fora de ordem, concluir sem rodadas e valores absurdos', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'cores-invalida'
    const { body } = await http.post('/sessions/cores').send({ participanteId }).expect(201)
    const finalizar = (corpo: Record<string, unknown>) =>
      http.post(`/sessions/cores/${body.id}/finish`).send({ participanteId, status: 'CONCLUIDA', ...corpo })

    const lacuna = await finalizar({ rodadas: [rodada(1, true), rodada(3, true)] }).expect(400)
    expect(lacuna.body.detalhes).toEqual(expect.arrayContaining([expect.stringMatching(/^rodadas\.1\.rodada:/)]))
    await finalizar({ rodadas: [] }).expect(400)
    await finalizar({ rodadas: [rodada(1, true, -1)] }).expect(400)
    await finalizar({ rodadas: [rodada(1, true)], maiorSequencia: 99 }).expect(400) // o serviço recalcula: nem aceita o campo

    await finalizar({ rodadas: [rodada(1, true)] }).expect(200)
  })

  it('cancelar sem nenhuma rodada é válido, e uma rodada sem tempo medido também', async () => {
    const http = request(app.getHttpServer())
    const participanteId = 'cores-cancela'
    const a = await http.post('/sessions/cores').send({ participanteId }).expect(201)
    await http.post(`/sessions/cores/${a.body.id}/finish`).send({ participanteId, status: 'CANCELADA', rodadas: [] }).expect(200)

    const b = await http.post('/sessions/cores').send({ participanteId }).expect(201)
    const fim = await http
      .post(`/sessions/cores/${b.body.id}/finish`)
      .send({ participanteId, status: 'CONCLUIDA', rodadas: [rodada(1, true, null)] })
      .expect(200)
    expect(fim.body.tempoRespostaMedioMs).toBeNull()
  })
})
