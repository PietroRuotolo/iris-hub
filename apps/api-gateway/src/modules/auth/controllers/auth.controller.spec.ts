import type { Logger } from '@iris/logger'
import type { Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import type { RespostaServico } from '../../../core/utils/encaminhar.js'
import { EmailsClient } from '../../emails/clients/emails.client.js'
import { AuthClient } from '../clients/auth.client.js'
import { AuthGatewayController } from './auth.controller.js'

function criarController(resultadoCadastro: RespostaServico, resultadoEmail: RespostaServico = { status: 202, corpo: null }) {
  const auth = { cadastrar: vi.fn().mockResolvedValue(resultadoCadastro) } as unknown as AuthClient
  const emails = { enviar: vi.fn().mockResolvedValue(resultadoEmail) } as unknown as EmailsClient
  const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() } as Logger
  const resposta = { status: vi.fn() } as unknown as Response
  return { controller: new AuthGatewayController(auth, emails, log), auth, emails, log, resposta }
}

describe('AuthGatewayController.cadastrar', () => {
  it('dispara o template de boas-vindas após um cadastro concluído', async () => {
    const { controller, emails, resposta } = criarController({
      status: 201,
      corpo: { usuario: { email: 'ana@example.com' }, token: 'session-token' },
    })

    const body = await controller.cadastrar({ nome: 'Ana', email: 'ana@example.com' }, resposta)

    expect(emails.enviar).toHaveBeenCalledWith({ para: 'ana@example.com', template: 'welcome' })
    expect(body).toEqual({ usuario: { email: 'ana@example.com' }, token: 'session-token' })
    expect(resposta.status).toHaveBeenCalledWith(201)
  })

  it('não envia boas-vindas quando o cadastro falha', async () => {
    const { controller, emails, resposta } = criarController({ status: 409, corpo: { erro: 'Já cadastrado' } })

    await controller.cadastrar({ nome: 'Ana', email: 'ana@example.com' }, resposta)

    expect(emails.enviar).not.toHaveBeenCalled()
    expect(resposta.status).toHaveBeenCalledWith(409)
  })

  it('não falha o cadastro quando o serviço de e-mail rejeita o envio', async () => {
    const { controller, log, resposta } = criarController(
      { status: 201, corpo: { usuario: { email: 'ana@example.com' }, token: 'session-token' } },
      { status: 503, corpo: null },
    )

    await controller.cadastrar({ nome: 'Ana', email: 'ana@example.com' }, resposta)
    await Promise.resolve()

    expect(log.warn).toHaveBeenCalledWith('Falha ao enviar e-mail de boas-vindas', { status: 503 })
    expect(resposta.status).toHaveBeenCalledWith(201)
  })
})
