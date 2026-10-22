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
  process.env.MONGO_URI = mongo.getUri('iris-teste-ranking')
  process.env.LOG_LEVEL = 'error'
  const { AppModule } = await import('../src/app.module.js')
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()

  // Ana jogou os 3 (duas partidas do reflexo: conta a melhor; uma das cores abandonada: não conta).
  // Bia não jogou as cores: fica fora do ranking.
  const prisma = app.get(PrismaService)
  const ana = await prisma.user.create({ data: { nome: 'Ana Souza', email: 'ana@exemplo.com' } })
  const bia = await prisma.user.create({ data: { nome: 'Bia Lima', email: 'bia@exemplo.com' } })
  await prisma.rhythmSession.create({ data: { playerId: ana.id, status: 'completed', totalScore: 90 } })
  await prisma.reflexSession.create({ data: { playerId: ana.id, status: 'completed', totalScore: 300 } })
  await prisma.reflexSession.create({ data: { playerId: ana.id, status: 'completed', totalScore: 400 } })
  await prisma.colorSession.create({ data: { playerId: ana.id, status: 'completed', score: 450 } })
  await prisma.colorSession.create({ data: { playerId: ana.id, status: 'abandoned', score: 500 } })
  await prisma.rhythmSession.create({ data: { playerId: bia.id, status: 'completed', totalScore: 100 } })
  // Caio jogou os 3, mas a única partida do ritmo ficou sem nota (rastreamento insuficiente): fica fora.
  const caio = await prisma.user.create({ data: { nome: 'Caio Reis', email: 'caio@exemplo.com' } })
  await prisma.rhythmSession.create({ data: { playerId: caio.id, status: 'completed', totalScore: null } })
  await prisma.reflexSession.create({ data: { playerId: caio.id, status: 'completed', totalScore: 500 } })
  await prisma.colorSession.create({ data: { playerId: caio.id, status: 'completed', score: 500 } })
  await prisma.reflexSession.create({ data: { playerId: bia.id, status: 'completed', totalScore: 500 } })
})

afterAll(async () => {
  await app?.close()
  await mongo?.stop()
})

describe('ranking (e2e)', () => {
  it('lê as melhores partidas concluídas de cada jogo no MongoDB', async () => {
    const { body } = await request(app.getHttpServer()).get('/ranking').expect(200)
    expect(body).toEqual([expect.objectContaining({ posicao: 1, nome: 'Ana Souza', ritmo: 90, reflexo: 80, cores: 90, geral: 86.7 })])
  })
})