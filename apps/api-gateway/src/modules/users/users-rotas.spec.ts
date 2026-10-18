import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { EmailsClient } from '../emails/clients/emails.client.js'
import { WhatsappClient } from '../whatsapp/clients/whatsapp.client.js'
import { UsersClient } from './clients/users.client.js'
import { UsersController } from './controllers/users.controller.js'

// O controller real com os clientes trocados por dublês: o que se testa é quando o gateway manda o
// e-mail de boas-vindas e que o cadastro nunca depende dele.
const usuarios = { criar: vi.fn(), buscar: vi.fn(), obter: vi.fn() }
const emails = { enviar: vi.fn() }
const whatsapp = { enviar: vi.fn() }
let app: INestApplication

beforeAll(async () => {
  const modulo = await Test.createTestingModule({
    controllers: [UsersController],
    providers: [
      { provide: UsersClient, useValue: usuarios },
      { provide: EmailsClient, useValue: emails },
      { provide: WhatsappClient, useValue: whatsapp },
    ],
  }).compile()
  app = modulo.createNestApplication({ logger: false })
  await app.init()
})

afterAll(() => app?.close())

const conta = { id: 'u1', nome: 'Ana Souza', email: 'ana@exemplo.com', emailMascarado: 'a***@exemplo.com', telefone: '11987654321' }

beforeEach(() => {
  usuarios.criar.mockReset().mockResolvedValue({ status: 201, corpo: conta })
  emails.enviar.mockReset().mockResolvedValue({ status: 202, corpo: { enviado: true } })
  whatsapp.enviar.mockReset().mockResolvedValue({ status: 202, corpo: { enviado: true } })
})

describe('gateway: cadastro e boas-vindas (e-mail e WhatsApp)', () => {
  // O e-mail de boas-vindas está desligado por enquanto (veja o UsersController): só o WhatsApp sai.
  it('com a conta criada, manda o WhatsApp de boas-vindas (o e-mail está desligado)', async () => {
    const { body } = await request(app.getHttpServer()).post('/users').send({ nome: 'Ana Souza' }).expect(201)
    expect(emails.enviar).not.toHaveBeenCalled()
    expect(whatsapp.enviar).toHaveBeenCalledWith({ para: '11987654321', template: 'welcome' })
    expect(body).toEqual({ ...conta, emailEnviado: false, whatsappEnviado: true })
  })

  it('um falhar não atrapalha o outro nem o cadastro', async () => {
    whatsapp.enviar.mockResolvedValue({ status: 503, corpo: { erro: 'WHATSAPP_WELCOME_MEDIA não está configurada' } })
    const { body } = await request(app.getHttpServer()).post('/users').send({}).expect(201)
    expect(body).toMatchObject({ whatsappEnviado: false })
  })

  it('conta sem telefone: não tenta o WhatsApp', async () => {
    usuarios.criar.mockResolvedValue({ status: 201, corpo: { ...conta, telefone: null } })
    const { body } = await request(app.getHttpServer()).post('/users').send({}).expect(201)
    expect(whatsapp.enviar).not.toHaveBeenCalled()
    expect(body.whatsappEnviado).toBe(false)
  })

  it('sem conta criada (409, 400), não manda nada e repassa o erro', async () => {
    usuarios.criar.mockResolvedValue({ status: 409, corpo: { erro: 'Já existe uma conta com este e-mail' } })
    await request(app.getHttpServer()).post('/users').send({}).expect(409)
    usuarios.criar.mockResolvedValue({ status: 400, corpo: { erro: 'Dados inválidos' } })
    await request(app.getHttpServer()).post('/users').send({}).expect(400)
    expect(emails.enviar).not.toHaveBeenCalled()
    expect(whatsapp.enviar).not.toHaveBeenCalled()
  })

  it('o WhatsApp falhar não desfaz o cadastro', async () => {
    whatsapp.enviar.mockRejectedValue(new Error('email-service fora do ar'))
    expect((await request(app.getHttpServer()).post('/users').send({}).expect(201)).body.whatsappEnviado).toBe(false)
  })

  it('WhatsApp que demora: responde sem ele, depois do limite', async () => {
    const controller = app.get(UsersController)
    controller.limiteEmailMs = 50
    whatsapp.enviar.mockReturnValue(new Promise(() => {})) // nunca responde
    const resposta = await request(app.getHttpServer()).post('/users').send({}).expect(201)
    expect(resposta.body.whatsappEnviado).toBe(false)
  })
})
