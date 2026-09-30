import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuthClient } from '../auth/clients/auth.client.js'
import { ParticipanteService } from '../sessions/participante.service.js'
import { ResumosClient } from './clients/resumos.client.js'
import { ResumosController } from './controllers/resumos.controller.js'

const auth = {
  obterUsuario: vi.fn(async (authorization: string) =>
    authorization === 'Bearer token-da-ana'
      ? { status: 200, corpo: { usuario: { id: 'ana-id', nome: 'Ana Souza' } } }
      : { status: 401, corpo: { erro: 'Sessão inválida ou expirada' } },
  ),
}
const resumos = { criar: vi.fn(), obter: vi.fn() }
let app: INestApplication

beforeAll(async () => {
  const modulo = await Test.createTestingModule({
    controllers: [ResumosController],
    providers: [ParticipanteService, { provide: AuthClient, useValue: auth }, { provide: ResumosClient, useValue: resumos }],
  }).compile()  
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})
afterAll(() => app?.close())
beforeEach(() => {
  resumos.criar.mockReset().mockResolvedValue({ status: 201, corpo: { token: 't' } })
  resumos.obter.mockReset().mockResolvedValue({ status: 200, corpo: { nome: 'Ana' } })
})

describe('gateway: resumo compartilhado', () => {
  it('criar exige login e usa o id e o nome do login (o corpo do site é ignorado)', async () => {
    const http = request(app.getHttpServer())
    await http.post('/resumos').send({ participanteId: 'outra' }).expect(401)
    expect(resumos.criar).not.toHaveBeenCalled()

    await http.post('/resumos').set('authorization', 'Bearer token-da-ana').send({ participanteId: 'outra' }).expect(201)
    expect(resumos.criar).toHaveBeenCalledWith('ana-id', 'Ana Souza')
  })

  it('abrir pelo token não exige login e repassa a resposta do serviço', async () => {
    await request(app.getHttpServer()).get('/resumos/abc').expect(200).expect({ nome: 'Ana' })
    expect(resumos.obter).toHaveBeenCalledWith('abc')
    resumos.obter.mockResolvedValue({ status: 404, corpo: { erro: 'Não encontrado' } })
    await request(app.getHttpServer()).get('/resumos/abc').expect(404)
  })
})
