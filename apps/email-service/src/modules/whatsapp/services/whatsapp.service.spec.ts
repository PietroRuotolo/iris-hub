import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it, vi } from 'vitest'
import { SendWhatsappRequestDto } from '../dtos/request/send-whatsapp.request.dto.js'
import type { EvolutionClient } from './evolution.client.js'
import type { Ambiente } from '@iris/config'
import { ServiceUnavailableException } from '@nestjs/common'
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
    const servico = new WhatsappService(evolution as unknown as EvolutionClient, {} as Ambiente)
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

describe('boas-vindas (template welcome)', () => {
  it('manda a imagem do ambiente, com a legenda do ambiente e o arquivo bem-vindo.png', async () => {
    const evolution = { enviarTexto: vi.fn(), enviarImagem: vi.fn() }
    const ambiente = { whatsappWelcomeMedia: 'https://cdn.exemplo/boas-vindas.png', whatsappWelcomeCaption: 'Bem-vindo ao Íris Hub!' } as Ambiente
    await new WhatsappService(evolution as unknown as EvolutionClient, ambiente).enviar({ para: '11987654321', template: 'welcome' })
    expect(evolution.enviarImagem).toHaveBeenCalledWith({
      numero: '5511987654321',
      url: 'https://cdn.exemplo/boas-vindas.png',
      tipo: 'image/png',
      nomeArquivo: 'bem-vindo.png',
      legenda: 'Bem-vindo ao Íris Hub!',
    })
  })

  it('sem a imagem no ambiente: 503, sem chamar o provedor', async () => {
    const evolution = { enviarTexto: vi.fn(), enviarImagem: vi.fn() }
    const servico = new WhatsappService(evolution as unknown as EvolutionClient, {} as Ambiente)
    await expect(servico.enviar({ para: '11987654321', template: 'welcome' })).rejects.toBeInstanceOf(ServiceUnavailableException)
    expect(evolution.enviarImagem).not.toHaveBeenCalled()
  })

  it('o template não precisa de texto', () => {
    expect(problemas({ para: '11987654321', template: 'welcome' })).toEqual([])
    expect(problemas({ para: '11987654321', template: 'outro' })).toEqual(['template'])
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
