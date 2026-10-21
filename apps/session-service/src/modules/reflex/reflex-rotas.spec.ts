import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { Prisma } from '@prisma/client'
import request from 'supertest'
import { ModuloCompartilhado } from '@iris/shared'
import { ReflexSessionsController } from './controllers/reflex-sessions.controller.js'
import { ReflexSessionsRepository } from './repositories/reflex-sessions.repository.js'
import { ReflexSessionsService } from './services/reflex-sessions.service.js'

// As rotas de verdade (validação, regras, respostas) com um banco falso em memória no lugar do MongoDB.
// O teste com o MongoDB de verdade fica em test/reflex.e2e-spec.ts (npm run test:e2e).
const banco = new Map<string, Record<string, unknown>>()
const repositorio = {
  async criar(dados: Prisma.ReflexSessionUncheckedCreateInput) {
    const { attempts, ...partida } = dados
    const doc = { inputSource: null, ...partida, attempts: attempts!.create as unknown[] }
    banco.set(dados.id!, doc)
    return doc
  },
  async listarPorJogador(playerId: string) {
    return [...banco.values()].filter((p) => p.playerId === playerId).sort((a, b) => +(b.startedAt as Date) - +(a.startedAt as Date))
  },
  async buscarPorId(id: string) {
    return banco.get(id) ?? null
  },
}

let app: INestApplication

beforeAll(async () => {
  process.env.LOG_LEVEL = 'error'
  const modulo = await Test.createTestingModule({
    imports: [ModuloCompartilhado.paraServico('session-service')],
    controllers: [ReflexSessionsController],
    providers: [ReflexSessionsService, { provide: ReflexSessionsRepository, useValue: repositorio }],
  }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(() => app?.close())
beforeEach(() => banco.clear())

const fase = (n: number, extra: Record<string, unknown> = {}) => ({ attemptNumber: n, command: 'press', waitTimeMs: 2000, windowMs: 1500, pressedAfterMs: 825, ...extra })
const partida = (n = 1, fases = 5, extra: Record<string, unknown> = {}) => ({
  id: `0192f0a0-0000-7000-8000-00000000000${n}`,
  playerId: 'ana',
  status: fases === 5 ? 'completed' : 'abandoned',
  inputSource: 'MOUSE_CLICK',
  startedAt: `2026-10-19T12:0${n}:00.000Z`,
  attempts: Array.from({ length: fases }, (_, i) => fase(i + 1, i === 1 ? { command: 'hold', pressedAfterMs: null } : {})),
  ...extra,
})

describe('session-service: partidas do reflexo', () => {
  it('grava a partida com os pontos calculados no serviço', async () => {
    const { body } = await request(app.getHttpServer()).post('/reflex-sessions').send(partida()).expect(201)
    // 4 acertos de 80 + 1 "segurou" de 100.
    expect(body).toMatchObject({ playerId: 'ana', status: 'completed', totalScore: 420, validAttempts: 5, averageTimeMs: 825, inputSource: 'MOUSE_CLICK' })
    expect(body.attempts.map((a: { result: string; score: number }) => [a.result, a.score])).toEqual([
      ['success', 80],
      ['held', 100],
      ['success', 80],
      ['success', 80],
      ['success', 80],
    ])
  })

  it('o mesmo id de novo não duplica; de outro jogador, é conflito', async () => {
    const http = request(app.getHttpServer())
    await http.post('/reflex-sessions').send(partida()).expect(201)
    await http.post('/reflex-sessions').send(partida()).expect(201)
    expect(banco.size).toBe(1)
    await http.post('/reflex-sessions').send({ ...partida(), playerId: 'joao' }).expect(409)
  })

  it('lista as partidas do jogador e não mostra a de outro', async () => {
    const http = request(app.getHttpServer())
    await http.post('/reflex-sessions').send(partida(1)).expect(201)
    await http.post('/reflex-sessions').send(partida(2, 2)).expect(201)
    const { body } = await http.get('/reflex-sessions?playerId=ana').expect(200)
    expect(body.map((p: { status: string }) => p.status)).toEqual(['abandoned', 'completed'])
    await http.get(`/reflex-sessions/${partida(1).id}?playerId=joao`).expect(404)
    await http.get('/reflex-sessions').expect(400)
  })

  it('recusa dados inválidos dizendo o que está errado', async () => {
    const http = request(app.getHttpServer())
    const semAperto = await http.post('/reflex-sessions').send(partida(1, 1, { attempts: [{ ...fase(1), pressedAfterMs: undefined }] })).expect(400)
    expect(semAperto.body.detalhes.join(' ')).toContain('pressedAfterMs')
    const incompleta = await http.post('/reflex-sessions').send({ ...partida(1, 3), status: 'completed' }).expect(400)
    expect(incompleta.body.detalhes).toContain('status: uma partida completed tem as 5 fases')
    await http.post('/reflex-sessions').send({ ...partida(), inputSource: 'TECLADO' }).expect(400)
    expect(banco.size).toBe(0)
  })
})