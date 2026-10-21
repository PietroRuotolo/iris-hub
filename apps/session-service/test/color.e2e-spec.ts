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
  process.env.MONGO_URI = mongo.getUri('iris-teste-cores')
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

const SEQ = [
  [0, 1, 2],
  [3, 4, 0, 1],
  [2, 3, 4, 0, 1],
  [1, 2, 3, 4, 0, 1],
  [4, 3, 2, 1, 0, 1, 2],
]
/** Todas as fases certas a 400 ms por cor (100 pontos cada), menos a 2ª: errada na 3ª cor. */
function partida(n: number, fases: number) {
  return {
    id: `0192f0a0-0000-7000-8000-00000000000${n}`,
    playerId: 'ana',
    status: fases === 5 ? 'completed' : 'abandoned',
    inputSource: 'ESP32_BUTTON',
    startedAt: `2026-10-21T12:0${n}:00.000Z`,
    rounds: Array.from({ length: fases }, (_, i) => ({
      roundNumber: i + 1,
      expectedSequence: SEQ[i],
      playerSequence: i === 1 ? [3, 4, 1] : SEQ[i],
      responseTimeMs: i === 1 ? 1500 : SEQ[i].length * 400,
    })),
  }
}

describe('partidas das cores (e2e)', () => {
  it('grava a partida e as fases no MongoDB, com os pontos calculados no serviço', async () => {
    const { body } = await request(app.getHttpServer()).post('/color-sessions').send(partida(1, 5)).expect(201)
    expect(body).toMatchObject({ status: 'completed', score: 400, roundsCompleted: 4, totalErrors: 1, maxSequenceLength: 7, inputSource: 'ESP32_BUTTON' })
    const prisma = app.get(PrismaService)
    expect(await prisma.colorSession.count()).toBe(1)
    expect(await prisma.colorRound.count()).toBe(5)
    const fase2 = await prisma.colorRound.findFirst({ where: { roundNumber: 2 } })
    expect(fase2).toMatchObject({ expectedSequence: [3, 4, 0, 1], playerSequence: [3, 4, 1], result: 'wrong_color', score: 0 })
  })

  it('repetir o envio não duplica; jogar de novo é outra partida', async () => {
    const http = request(app.getHttpServer())
    await http.post('/color-sessions').send(partida(1, 5)).expect(201)
    await http.post('/color-sessions').send(partida(2, 2)).expect(201)
    const { body } = await http.get('/color-sessions?playerId=ana').expect(200)
    expect(body.map((p: { id: string; status: string }) => [p.id, p.status])).toEqual([
      [partida(2, 2).id, 'abandoned'],
      [partida(1, 5).id, 'completed'],
    ])
    expect(await app.get(PrismaService).colorSession.count()).toBe(2)
  })
})