import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it, vi } from 'vitest'
import { SendWhatsappRequestDto } from '../dtos/request/send-whatsapp.request.dto.js'
import type { EvolutionClient } from './evolution.client.js'
import { WhatsappService, numeroComPais, tipoDaImagem } from './whatsapp.service.js'

const problemas = (corpo: object) => validateSync(plainToInstance(SendWhatsappRequestDto, corpo)).map((e) => e.property)

describe('WhatsappService', () => {
  it('põe o 55 do Brasil quando o número vem só com o DDD', () => {
    expect(numeroComPais('11987654321')).toBe('5511987654321')
    expect(numeroComPais('(11) 3456-7890')).toBe('551134567890')
    expect(numeroComPais('5511987654321')).toBe('5511987654321')
  })

  it('descobre o tipo da imagem pela extensão', () => {
    expect(tipoDaImagem('https://x.com/a/foto.JPG')).toBe('image/jpeg')
    expect(tipoDaImagem('https://x.com/a.webp?v=2')).toBe('image/webp')
    expect(tipoDaImagem('https://x.com/imagem')).toBe('image/png')
  })

  it('sem imagem manda texto; com imagem manda a imagem com o texto de legenda', async () => {
    const evolution = { enviarTexto: vi.fn(), enviarImagem: vi.fn() }
    const servico = new WhatsappService(evolution as unknown as EvolutionClient)
    await servico.enviar({ para: '11987654321', texto: 'Olá!' })
    expect(evolution.enviarTexto).toHaveBeenCalledWith({ numero: '5511987654321', texto: 'Olá!' })

    await servico.enviar({ para: '11987654321', texto: 'Veja', imagem: { url: 'https://cdn.exemplo/iris%20hub.jpg' } })
    expect(evolution.enviarImagem).toHaveBeenCalledWith({
      numero: '5511987654321',
      url: 'https://cdn.exemplo/iris%20hub.jpg',
      tipo: 'image/jpeg',
      nomeArquivo: 'iris hub.jpg',
      legenda: 'Veja',
    })
  })
})

describe('SendWhatsappRequestDto', () => {
  it('aceita texto, ou imagem com ou sem legenda', () => {
    expect(problemas({ para: '(11) 98765-4321', texto: 'Olá' })).toEqual([])
    expect(problemas({ para: '5511987654321', imagem: { url: 'https://x.com/a.png' } })).toEqual([])
  })

  it('recusa telefone inválido, mensagem vazia de tudo e imagem sem endereço válido', () => {
    expect(problemas({ para: '98765-4321', texto: 'Olá' })).toEqual(['para'])
    expect(problemas({ para: '11987654321' })).toEqual(['texto'])
    expect(problemas({ para: '11987654321', imagem: { url: 'arquivo.png' } })).toEqual(['imagem'])
  })
})
