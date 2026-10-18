import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EvolutionClient, urlCodificada, urlDeMidia } from './evolution.client.js'

const ambiente = { whatsappSendUrl: 'https://evolution.exemplo/message/sendText/iris', whatsappApiKey: 'chave-whatsapp' } as Ambiente
afterEach(() => vi.unstubAllGlobals())

function chamadas(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, opcoes] = fetchMock.mock.calls[0] as [string, RequestInit]
  return { url, apikey: new Headers(opcoes.headers).get('apikey'), corpo: JSON.parse(String(opcoes.body)) }
}

describe('endereços', () => {
  it('troca sendText por sendMedia para a imagem; outro endereço fica igual', () => {
    expect(urlDeMidia('https://x.onrender.com/message/sendText/iris-next2026')).toBe('https://x.onrender.com/message/sendMedia/iris-next2026')
    expect(urlDeMidia('https://outro.exemplo/enviar')).toBe('https://outro.exemplo/enviar')
  })

  it('codifica acento e espaço na imagem, sem codificar duas vezes', () => {
    expect(urlCodificada('https://res.cloudinary.com/x/Íris__Sinais de D.png')).toBe('https://res.cloudinary.com/x/%C3%8Dris__Sinais%20de%20D.png')
    expect(urlCodificada('https://res.cloudinary.com/x/%C3%8Dris.png')).toBe('https://res.cloudinary.com/x/%C3%8Dris.png')
  })
})

describe('EvolutionClient', () => {
  it('texto: POST na URL configurada, com a chave no header apikey', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    await new EvolutionClient(ambiente).enviarTexto({ numero: '5511987654321', texto: 'Olá!' })
    expect(chamadas(fetchMock)).toEqual({
      url: 'https://evolution.exemplo/message/sendText/iris',
      apikey: 'chave-whatsapp',
      corpo: { number: '5511987654321', text: 'Olá!' },
    })
  })

  it('imagem: no endereço de mídia (sendMedia), com o corpo de mídia', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    await new EvolutionClient(ambiente).enviarImagem({ numero: '5511987654321', url: 'https://img.exemplo/a.png', tipo: 'image/png', nomeArquivo: 'a.png', legenda: 'Oi' })
    expect(chamadas(fetchMock)).toMatchObject({
      url: 'https://evolution.exemplo/message/sendMedia/iris',
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

  it('provedor recusou ou fora do ar: 502, com o motivo que ele deu', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"message":"Unauthorized"}', { status: 401 })))
    await expect(new EvolutionClient(ambiente).enviarTexto({ numero: '55', texto: 'x' })).rejects.toThrow('recusou (401): {"message":"Unauthorized"}')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede')))
    await expect(new EvolutionClient(ambiente).enviarTexto({ numero: '55', texto: 'x' })).rejects.toBeInstanceOf(BadGatewayException)
  })
})
