import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MicrosoftGraphClient } from './microsoft-graph.client.js'

const ambiente = { emailApiKey: 'graph-access-token', microsoftSendMailUrl: 'https://graph.exemplo/sendMail' } as Ambiente
afterEach(() => vi.unstubAllGlobals())

describe('MicrosoftGraphClient', () => {
  it('envia template HTML com o token para a URL configurada', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    const client = new MicrosoftGraphClient(ambiente)
    await client.enviar({ para: 'destino@example.com', assunto: 'Teste do Iris Hub', html: '<p>Este é um teste.</p>' })

    const [url, opcoes] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://graph.exemplo/sendMail')
    expect(new Headers(opcoes.headers).get('authorization')).toBe('Bearer graph-access-token')
    expect(JSON.parse(String(opcoes.body))).toEqual({
      message: {
        subject: 'Teste do Iris Hub',
        body: { contentType: 'HTML', content: '<p>Este é um teste.</p>' },
        toRecipients: [{ emailAddress: { address: 'destino@example.com' } }],
      },
      saveToSentItems: true,
    })
  })

  it('não envia sem EMAIL_API_KEY', async () => {
    const client = new MicrosoftGraphClient({} as Ambiente)
    await expect(client.enviar({ para: 'destino@example.com', assunto: 'Teste', html: '<p>Oi</p>' }))
      .rejects.toBeInstanceOf(ServiceUnavailableException)
  })

  it('não envia sem MICROSOFT_SEND_MAIL_URL', async () => {
    const client = new MicrosoftGraphClient({ emailApiKey: 'graph-access-token' } as Ambiente)
    await expect(client.enviar({ para: 'destino@example.com', assunto: 'Teste', html: '<p>Oi</p>' }))
      .rejects.toBeInstanceOf(ServiceUnavailableException)
  })

  it('converte falha do Graph em erro de gateway', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })))
    const client = new MicrosoftGraphClient(ambiente)
    await expect(client.enviar({ para: 'destino@example.com', assunto: 'Teste', html: '<p>Oi</p>' }))
      .rejects.toBeInstanceOf(BadGatewayException)
  })
})
