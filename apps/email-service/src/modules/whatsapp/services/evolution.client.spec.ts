import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EvolutionClient } from './evolution.client.js'

const ambiente = { whatsappSendUrl: 'https://whatsapp.exemplo/enviar', whatsappApiKey: 'chave-whatsapp' } as Ambiente
afterEach(() => vi.unstubAllGlobals())

function chamadas(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, opcoes] = fetchMock.mock.calls[0] as [string, RequestInit]
  return { url, apikey: new Headers(opcoes.headers).get('apikey'), corpo: JSON.parse(String(opcoes.body)) }
}

describe('EvolutionClient', () => {
  it('texto: POST na URL configurada, com a chave no header apikey', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    await new EvolutionClient(ambiente).enviarTexto({ numero: '5511987654321', texto: 'Olá!' })
    expect(chamadas(fetchMock)).toEqual({
      url: 'https://whatsapp.exemplo/enviar',
      apikey: 'chave-whatsapp',
      corpo: { number: '5511987654321', text: 'Olá!' },
    })
  })

  it('imagem: o mesmo POST, com o corpo de mídia', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    await new EvolutionClient(ambiente).enviarImagem({ numero: '5511987654321', url: 'https://img.exemplo/a.png', tipo: 'image/png', nomeArquivo: 'a.png', legenda: 'Oi' })
    expect(chamadas(fetchMock)).toMatchObject({
      url: 'https://whatsapp.exemplo/enviar',
      corpo: { number: '5511987654321', mediatype: 'image', mimetype: 'image/png', caption: 'Oi', media: 'https://img.exemplo/a.png', fileName: 'a.png' },
    })
  })

  it('sem a chave ou sem a URL: 503, sem chamar o provedor', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(new EvolutionClient({ ...ambiente, whatsappApiKey: null }).enviarTexto({ numero: '55', texto: 'x' })).rejects.toBeInstanceOf(ServiceUnavailableException)
    await expect(new EvolutionClient({ ...ambiente, whatsappSendUrl: null }).enviarImagem({ numero: '55', url: 'u', tipo: 't', nomeArquivo: 'n', legenda: '' })).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('provedor recusou ou fora do ar: 502', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    await expect(new EvolutionClient(ambiente).enviarTexto({ numero: '55', texto: 'x' })).rejects.toBeInstanceOf(BadGatewayException)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede')))
    await expect(new EvolutionClient(ambiente).enviarTexto({ numero: '55', texto: 'x' })).rejects.toBeInstanceOf(BadGatewayException)
  })
})
