import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import request from 'supertest'
import { PrismaService } from '@iris/shared'

let mongo: MongoMemoryReplSet
let app: INestApplication

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  process.env.MONGO_URI = mongo.getUri('iris-teste-ritmo')
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

/** Acerto com nota de tempo 0,5 e de precisão 0,75 (80 pontos; 40 pelo ímã). */
const acerto = (n: number, byMagnet = false) => ({
  targetNumber: n,
  result: 'hit',
  byMagnet,
  targetX: 0.5,
  targetY: 0.5,
  targetRadiusPx: 80,
  windowMs: 500,
  trackingCoverage: 1,
  entryOffsetMs: -250,
  latencyMs: 900,
  dwellTimeMs: 400,
  averageCenterDistancePx: 20,
})
const semResposta = (n: number) => ({ targetNumber: n, result: 'no_response', byMagnet: false, targetX: 0.2, targetY: 0.8, targetRadiusPx: 80, windowMs: 500, trackingCoverage: 0.9 })

/** Uma partida começando na hora `h`, com `fases` fases de 3 alvos (acerto, acerto pelo ímã, sem resposta). */
function partida(n: number, fases: number, h = 12) {
  const em = (min: number, s: number) => `2026-10-18T${h}:0${min}:${s}0.000Z`
  return {
    id: `0192f0a0-0000-7000-8000-00000000000${n}`,
    playerId: 'ana',
    status: fases === 5 ? 'completed' : 'abandoned',
    startedAt: em(0, 0),
    phases: Array.from({ length: fases }, (_, i) => ({
      phaseNumber: i + 1,
      targetRadiusCm: 3,
      beatIntervalMs: 1600,
      startedAt: em(i + 1, 0),
      finishedAt: em(i + 1, 3),
      targets: [acerto(1), acerto(2, true), semResposta(3)],
    })),
  }
}

describe('partidas do ritmo (e2e)', () => {
  it('grava a partida, as fases e os alvos, com os pontos calculados no serviço', async () => {
    const { body } = await request(app.getHttpServer()).post('/rhythm-sessions').send(partida(1, 5)).expect(201)
    // Cada fase: (80 + 40 + 0) / 3 = 40.
    expect(body).toMatchObject({ id: partida(1, 5).id, playerId: 'ana', status: 'completed', totalScore: 40, phasesCompleted: 5, totalHits: 10, totalMisses: 5, scoringVersion: 'v1' })
    expect(body.phases).toHaveLength(5)
    expect(body.phases[0]).toMatchObject({ phaseNumber: 1, score: 40, totalTargets: 3, hits: 2, misses: 1, trackingCoverage: 96.7 })
    expect(body.phases[0].targets.map((t: { score: number; byMagnet: boolean }) => [t.score, t.byMagnet])).toEqual([
      [80, false],
      [40, true],
      [0, false],
    ])

    const prisma = app.get(PrismaService)
    expect(await prisma.rhythmPhase.count()).toBe(5)
    expect(await prisma.rhythmTarget.count()).toBe(15)
  })

  it('o mesmo id de novo (o site repetiu o envio) não duplica: devolve a partida já gravada', async () => {
    const { body } = await request(app.getHttpServer()).post('/rhythm-sessions').send(partida(1, 5)).expect(201)
    expect(body.id).toBe(partida(1, 5).id)
    expect(await app.get(PrismaService).rhythmSession.count()).toBe(1)
  })

  it('jogar de novo é uma partida nova; a lista vem da mais recente para a mais antiga', async () => {
    await request(app.getHttpServer()).post('/rhythm-sessions').send(partida(2, 2, 13)).expect(201)
    const { body } = await request(app.getHttpServer()).get('/rhythm-sessions?playerId=ana').expect(200)
    expect(body.map((p: { id: string; status: string; phasesCompleted: number }) => [p.id, p.status, p.phasesCompleted])).toEqual([
      [partida(2, 2).id, 'abandoned', 2],
      [partida(1, 5).id, 'completed', 5],
    ])
  })

  it('o id de outro jogador é conflito, e a partida de outro jogador não aparece', async () => {
    const { id } = partida(1, 5)
    await request(app.getHttpServer()).post('/rhythm-sessions').send({ ...partida(1, 5), playerId: 'joao' }).expect(409)
    await request(app.getHttpServer()).get(`/rhythm-sessions/${id}?playerId=joao`).expect(404)
    await request(app.getHttpServer()).get(`/rhythm-sessions/${id}?playerId=ana`).expect(200)
  })

  it('recusa uma partida que fere as regras ou com campos inválidos, dizendo o que está errado', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/rhythm-sessions')
      .send({ ...partida(3, 4), status: 'completed' })
      .expect(400)
    expect(body.detalhes).toContain('status: uma partida completed tem as 5 fases')

    const invalida = partida(4, 1)
    invalida.phases[0].targets[0] = { ...acerto(1), targetX: 2 }
    const { body: corpo } = await request(app.getHttpServer()).post('/rhythm-sessions').send(invalida).expect(400)
    expect(corpo.detalhes.join(' ')).toContain('targetX')
    expect(await app.get(PrismaService).rhythmSession.count()).toBe(2)
  })
})
