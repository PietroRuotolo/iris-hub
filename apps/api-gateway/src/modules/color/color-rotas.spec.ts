import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UsersClient } from '../users/clients/users.client.js'
import { JogadorService } from '../users/jogador.service.js'
import { ColorSessionsClient } from './clients/color-sessions.client.js'
import { ColorSessionsController } from './controllers/color-sessions.controller.js'

// O controller real com os clientes trocados por dublês: o que se testa é o que o gateway decide
// (quem é o jogador) e o que ele manda ao session-service.
const usuarios = {
  obter: vi.fn(async (id: string) => (id === 'ana-id' ? { status: 200, corpo: { id: 'ana-id', nome: 'Ana Souza' } } : { status: 404, corpo: { erro: 'Não encontrado' } })),
}
const partidas = { criar: vi.fn(), listar: vi.fn(), obter: vi.fn() }
let app: INestApplication

beforeAll(async () => {
  const modulo = await Test.createTestingModule({
    controllers: [ColorSessionsController],
    providers: [JogadorService, { provide: UsersClient, useValue: usuarios }, { provide: ColorSessionsClient, useValue: partidas }],
  }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(() => app?.close())

beforeEach(() => {
  for (const fn of Object.values(partidas)) fn.mockReset().mockResolvedValue({ status: 200, corpo: { ok: true } })
})

const ANA = { 'x-jogador-id': 'ana-id' }

describe('gateway: partidas das cores', () => {
  it('sem jogador responde 400; jogador inexistente, 404; e nada chega ao serviço', async () => {
    const http = request(app.getHttpServer())
    await http.post('/color-sessions').send({}).expect(400)
    await http.get('/color-sessions').expect(400)
    await http.get('/color-sessions').set('x-jogador-id', 'nao-existe').expect(404)
    for (const fn of Object.values(partidas)) expect(fn).not.toHaveBeenCalled()
  })

  it('o playerId vem do jogador conferido, não do corpo', async () => {
    partidas.criar.mockResolvedValue({ status: 201, corpo: { id: 'nova' } })
    await request(app.getHttpServer()).post('/color-sessions').set(ANA).send({ playerId: 'outra', status: 'abandoned', rounds: [] }).expect(201)
    expect(partidas.criar).toHaveBeenCalledWith({ playerId: 'ana-id', status: 'abandoned', rounds: [] })
  })

  it('listar e obter usam o jogador conferido', async () => {
    const http = request(app.getHttpServer())
    await http.get('/color-sessions').set(ANA).expect(200)
    expect(partidas.listar).toHaveBeenCalledWith('ana-id', undefined)
    await http.get('/color-sessions/abc').set(ANA).expect(200)
    expect(partidas.obter).toHaveBeenCalledWith('abc', 'ana-id')
  })
})