import { Injectable } from '@nestjs/common'
import type { SendWhatsappRequestDto } from '../dtos/request/send-whatsapp.request.dto.js'
import { EvolutionClient } from './evolution.client.js'

/** O número como o provedor espera: só dígitos, com o 55 do Brasil (o cadastro guarda só o DDD + número). */
export const numeroComPais = (telefone: string) => {
  const digitos = telefone.replace(/\D/g, '')
  return digitos.length <= 11 ? `55${digitos}` : digitos
}

/** O tipo da imagem pela extensão do endereço; png se não der para saber. */
export function tipoDaImagem(url: string): string {
  const extensao = new URL(url).pathname.split('.').pop()?.toLowerCase()
  if (extensao === 'jpg' || extensao === 'jpeg') return 'image/jpeg'
  if (extensao === 'webp') return 'image/webp'
  return 'image/png'
}

const nomeDaImagem = (url: string) => decodeURIComponent(new URL(url).pathname.split('/').pop() || '') || 'imagem.png'

@Injectable()
export class WhatsappService {
  constructor(private readonly evolution: EvolutionClient) {}

  async enviar(dados: SendWhatsappRequestDto): Promise<{ enviado: true }> {
    const numero = numeroComPais(dados.para)
    if (dados.imagem) {
      await this.evolution.enviarImagem({
        numero,
        url: dados.imagem.url,
        tipo: dados.imagem.tipo ?? tipoDaImagem(dados.imagem.url),
        nomeArquivo: dados.imagem.nomeArquivo ?? nomeDaImagem(dados.imagem.url),
        legenda: dados.texto ?? '',
      })
    } else {
      await this.evolution.enviarTexto({ numero, texto: dados.texto! })
    }
    return { enviado: true }
  }
}
