import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuthClient } from '../auth/clients/auth.client.js'
import { JogosSessionsClient } from './clients/jogos-sessions.client.js'
import { SessionsClient } from './clients/sessions.client.js'
import { CoresSessionsController, ReflexoSessionsController } from './controllers/jogo-sessions.controller.js'
import { SessionsController } from './controllers/sessions.controller.js'
import { ParticipanteService } from './participante.service.js'

// Os controllers reais, na MESMA ORDEM do SessionsModule, com os clientes trocados por dublês:
// o que se testa aqui é o que o gateway decide (quem é a pessoa e para onde a rota vai).

const respostaOk = { status: 200, corpo: { ok: true } }
const auth = {
  obterUsuario: vi.fn(async (authorization: string) =>
    authorization === 'Bearer token-da-ana'
      ? { status: 200, corpo: { usuario: { id: 'ana-id' } } }
      : { status: 401, corpo: { erro: 'Sessão inválida ou expirada' } },
  ),
}
const jogos = { iniciar: vi.fn(), listar: vi.fn(), obter: vi.fn(), encerrar: vi.fn() }
const ritmo = { iniciar: vi.fn(), listar: vi.fn(), obter: vi.fn(), registrarFase: vi.fn(), encerrar: vi.fn() }

let app: INestApplication

beforeAll(async () => {
  const modulo = await Test.createTestingModule({
    controllers: [ReflexoSessionsController, CoresSessionsController, SessionsController],
    providers: [
      ParticipanteService,
      { provide: AuthClient, useValue: auth },
      { provide: JogosSessionsClient, useValue: jogos },
      { provide: SessionsClient, useValue: ritmo },
    ],
  }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(() => app?.close())

beforeEach(() => {
  for (const cliente of [jogos, ritmo]) for (const fn of Object.values(cliente)) fn.mockReset().mockResolvedValue(respostaOk)
})

const LOGADA = { authorization: 'Bearer token-da-ana' }

describe.each(['reflexo', 'cores'] as const)('gateway: sessões de %s', (jogo) => {
  it('sem login (ou com login inválido), toda rota responde 401 e nada chega ao serviço', async () => {
    const http = request(app.getHttpServer())
    await http.post(`/sessions/${jogo}`).send({}).expect(401)
    await http.get(`/sessions/${jogo}`).expect(401)
    await http.get(`/sessions/${jogo}/abc`).expect(401)
    await http.post(`/sessions/${jogo}/abc/finish`).send({}).expect(401)
    await http.get(`/sessions/${jogo}`).set('authorization', 'Bearer token-falso').expect(401)
    for (const fn of Object.values(jogos)) expect(fn).not.toHaveBeenCalled()
  })

  it('o participanteId do site é sobrescrito pelo do login, ao iniciar e ao encerrar', async () => {
    const http = request(app.getHttpServer())
    jogos.iniciar.mockResolvedValue({ status: 201, corpo: { id: 'nova' } }) // como o session-service responde
    await http.post(`/sessions/${jogo}`).set(LOGADA).send({ participanteId: 'outra-pessoa' }).expect(201)
    expect(jogos.iniciar).toHaveBeenCalledWith(jogo, { participanteId: 'ana-id' })

    await http.post(`/sessions/${jogo}/abc/finish`).set(LOGADA).send({ participanteId: 'outra-pessoa', status: 'CANCELADA' }).expect(200)
    expect(jogos.encerrar).toHaveBeenCalledWith(jogo, 'abc', { participanteId: 'ana-id', status: 'CANCELADA' })
  })

  it('listar e obter usam o id do login, e GET /sessions/<jogo> não cai em GET /sessions/:id', async () => {
    const http = request(app.getHttpServer())
    await http.get(`/sessions/${jogo}`).set(LOGADA).expect(200)
    expect(jogos.listar).toHaveBeenCalledWith(jogo, 'ana-id')
    expect(ritmo.obter).not.toHaveBeenCalled() // o controller do ritmo não pode ter capturado a rota

    await http.get(`/sessions/${jogo}/abc`).set(LOGADA).expect(200)
    expect(jogos.obter).toHaveBeenCalledWith(jogo, 'abc', 'ana-id')
  })

  it('repassa o status e o corpo do serviço, inclusive erros', async () => {
    jogos.obter.mockResolvedValue({ status: 404, corpo: { erro: 'Não encontrado' } })
    await request(app.getHttpServer()).get(`/sessions/${jogo}/abc`).set(LOGADA).expect(404).expect({ erro: 'Não encontrado' })
  })
})

describe('gateway: o jogo de ritmo continua funcionando depois da refatoração', () => {
  it('GET /sessions lista pelo controller do ritmo, com o id do login', async () => {
    await request(app.getHttpServer()).get('/sessions').set(LOGADA).expect(200)
    expect(ritmo.listar).toHaveBeenCalledWith('ana-id')
    expect(jogos.listar).not.toHaveBeenCalled()
  })

  it('GET /sessions/:id chega ao ritmo, e o corpo do site não escolhe o dono', async () => {
    const http = request(app.getHttpServer())
    await http.get('/sessions/abc123').set(LOGADA).expect(200)
    expect(ritmo.obter).toHaveBeenCalledWith('abc123', 'ana-id')

    await http.post('/sessions/abc123/phases').set(LOGADA).send({ participanteId: 'outra', fase: 1 }).expect(200)
    expect(ritmo.registrarFase).toHaveBeenCalledWith('abc123', { participanteId: 'ana-id', fase: 1 })
  })

  it('sem login, também responde 401', async () => {
    await request(app.getHttpServer()).get('/sessions').expect(401)
  })
})
