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
  process.env.MONGO_URI = mongo.getUri('iris-teste-reflexo')
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

/** Fase 2 é "NÃO APERTE!" e a pessoa segurou; as outras, "APERTE!" a 825 ms (80 pontos cada). */
function partida(n: number, fases: number) {
  return {
    id: `0192f0a0-0000-7000-8000-00000000000${n}`,
    playerId: 'ana',
    status: fases === 5 ? 'completed' : 'abandoned',
    inputSource: 'ESP32_BUTTON',
    startedAt: `2026-10-19T12:0${n}:00.000Z`,
    attempts: Array.from({ length: fases }, (_, i) => ({
      attemptNumber: i + 1,
      command: i === 1 ? 'hold' : 'press',
      waitTimeMs: 2000,
      windowMs: 1500,
      pressedAfterMs: i === 1 ? null : 825,
    })),
  }
}

describe('partidas do reflexo (e2e)', () => {
  it('grava a partida e as fases no MongoDB, com os pontos calculados no serviço', async () => {
    const { body } = await request(app.getHttpServer()).post('/reflex-sessions').send(partida(1, 5)).expect(201)
    expect(body).toMatchObject({ status: 'completed', totalScore: 420, validAttempts: 5, bestTimeMs: 825, inputSource: 'ESP32_BUTTON' })
    const prisma = app.get(PrismaService)
    expect(await prisma.reflexSession.count()).toBe(1)
    expect(await prisma.reflexAttempt.count()).toBe(5)
  })

  it('repetir o envio não duplica; jogar de novo é outra partida', async () => {
    const http = request(app.getHttpServer())
    await http.post('/reflex-sessions').send(partida(1, 5)).expect(201)
    await http.post('/reflex-sessions').send(partida(2, 2)).expect(201)
    const { body } = await http.get('/reflex-sessions?playerId=ana').expect(200)
    expect(body.map((p: { id: string; status: string }) => [p.id, p.status])).toEqual([
      [partida(2, 2).id, 'abandoned'],
      [partida(1, 5).id, 'completed'],
    ])
    expect(await app.get(PrismaService).reflexSession.count()).toBe(2)
  })
})