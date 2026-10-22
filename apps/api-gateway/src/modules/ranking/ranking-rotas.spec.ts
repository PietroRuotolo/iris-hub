import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { RankingClient } from './clients/ranking.client.js'
import { RankingController } from './controllers/ranking.controller.js'

// O controller real com o cliente trocado por um dublê: o que se testa é o que o gateway repassa.
const ranking = { geral: vi.fn() }
let app: INestApplication

beforeAll(async () => {
  const modulo = await Test.createTestingModule({
    controllers: [RankingController],
    providers: [{ provide: RankingClient, useValue: ranking }],
  }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(() => app?.close())
beforeEach(() => ranking.geral.mockReset().mockResolvedValue({ status: 200, corpo: [{ posicao: 1, nome: 'Ana Souza', geral: 86.7 }] }))

describe('gateway: ranking', () => {
  it('repassa o ranking sem pedir jogador', async () => {
    const { body } = await request(app.getHttpServer()).get('/ranking').expect(200)
    expect(body).toEqual([{ posicao: 1, nome: 'Ana Souza', geral: 86.7 }])
    expect(ranking.geral).toHaveBeenCalledWith(undefined)
  })

  it('repassa o limite e o erro do session-service', async () => {
    ranking.geral.mockResolvedValue({ status: 502, corpo: { erro: 'session-service fora do ar' } })
    const { body } = await request(app.getHttpServer()).get('/ranking?limite=10').expect(502)
    expect(body).toEqual({ erro: 'session-service fora do ar' })
    expect(ranking.geral).toHaveBeenCalledWith('10')
  })
})