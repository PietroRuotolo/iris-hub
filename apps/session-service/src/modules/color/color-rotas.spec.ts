import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { Prisma } from '@prisma/client'
import request from 'supertest'
import { ModuloCompartilhado } from '@iris/shared'
import { ColorSessionsController } from './controllers/color-sessions.controller.js'
import { ColorSessionsRepository } from './repositories/color-sessions.repository.js'
import { ColorSessionsService } from './services/color-sessions.service.js'

// As rotas de verdade (validação, regras, respostas) com um banco falso em memória no lugar do MongoDB.
// O teste com o MongoDB de verdade fica em test/color.e2e-spec.ts (npm run test:e2e).
const banco = new Map<string, Record<string, unknown>>()
const repositorio = {
  async criar(dados: Prisma.ColorSessionUncheckedCreateInput) {
    const { rounds, ...partida } = dados
    const doc = { inputSource: null, averageMsPerColor: null, ...partida, rounds: rounds!.create as unknown[] }
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
    controllers: [ColorSessionsController],
    providers: [ColorSessionsService, { provide: ColorSessionsRepository, useValue: repositorio }],
  }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(() => app?.close())
beforeEach(() => banco.clear())

const SEQ = [
  [0, 1, 2],
  [3, 4, 0, 1],
  [2, 3, 4, 0, 1],
  [1, 2, 3, 4, 0, 1],
  [4, 3, 2, 1, 0, 1, 2],
]
/** A fase n certa, a 400 ms por cor (100 pontos). */
const fase = (n: number, extra: Record<string, unknown> = {}) => ({
  roundNumber: n,
  expectedSequence: SEQ[n - 1],
  playerSequence: SEQ[n - 1],
  responseTimeMs: SEQ[n - 1].length * 400,
  ...extra,
})
const partida = (n = 1, fases = 5, extra: Record<string, unknown> = {}) => ({
  id: `0192f0a0-0000-7000-8000-00000000000${n}`,
  playerId: 'ana',
  status: fases === 5 ? 'completed' : 'abandoned',
  inputSource: 'MOUSE_CLICK',
  startedAt: `2026-10-21T12:0${n}:00.000Z`,
  // A fase 2 errada na 3ª cor.
  rounds: Array.from({ length: fases }, (_, i) => fase(i + 1, i === 1 ? { playerSequence: [3, 4, 1], responseTimeMs: 1500 } : {})),
  ...extra,
})

describe('session-service: partidas das cores', () => {
  it('grava a partida com os pontos calculados no serviço', async () => {
    const { body } = await request(app.getHttpServer()).post('/color-sessions').send(partida()).expect(201)
    // 4 fases certas de 100 + 1 errada.
    expect(body).toMatchObject({ playerId: 'ana', status: 'completed', score: 400, roundsCompleted: 4, totalErrors: 1, timeouts: 0, maxSequenceLength: 7, averageMsPerColor: 400, inputSource: 'MOUSE_CLICK' })
    expect(body.rounds.map((r: { result: string; score: number; sequenceLength: number }) => [r.result, r.score, r.sequenceLength])).toEqual([
      ['success', 100, 3],
      ['wrong_color', 0, 4],
      ['success', 100, 5],
      ['success', 100, 6],
      ['success', 100, 7],
    ])
  })

  it('o mesmo id de novo não duplica; de outro jogador, é conflito', async () => {
    const http = request(app.getHttpServer())
    await http.post('/color-sessions').send(partida()).expect(201)
    await http.post('/color-sessions').send(partida()).expect(201)
    expect(banco.size).toBe(1)
    await http.post('/color-sessions').send({ ...partida(), playerId: 'joao' }).expect(409)
  })

  it('lista as partidas do jogador e não mostra a de outro', async () => {
    const http = request(app.getHttpServer())
    await http.post('/color-sessions').send(partida(1)).expect(201)
    await http.post('/color-sessions').send(partida(2, 2)).expect(201)
    const { body } = await http.get('/color-sessions?playerId=ana').expect(200)
    expect(body.map((p: { status: string }) => p.status)).toEqual(['abandoned', 'completed'])
    await http.get(`/color-sessions/${partida(1).id}?playerId=joao`).expect(404)
    await http.get('/color-sessions').expect(400)
  })

  it('recusa dados inválidos dizendo o que está errado', async () => {
    const http = request(app.getHttpServer())
    const corInvalida = await http.post('/color-sessions').send(partida(1, 1, { rounds: [fase(1, { expectedSequence: [0, 1, 9] })] })).expect(400)
    expect(corInvalida.body.detalhes.join(' ')).toContain('expectedSequence')
    const incompleta = await http.post('/color-sessions').send({ ...partida(1, 3), status: 'completed' }).expect(400)
    expect(incompleta.body.detalhes).toContain('status: uma partida completed tem as 5 fases')
    await http.post('/color-sessions').send({ ...partida(), inputSource: 'JOYSTICK' }).expect(400)
    expect(banco.size).toBe(0)
  })
})