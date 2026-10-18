import { BadGatewayException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'

export type MensagemTexto = { numero: string; texto: string }

/**
 * Na Evolution API, texto e mídia têm endereços diferentes (`/message/sendText/<instância>` e
 * `/message/sendMedia/<instância>`). Com uma variável só, a de imagem sai trocando sendText por sendMedia.
 */
export const urlDeMidia = (url: string) => url.replace('/message/sendText/', '/message/sendMedia/')

/** Endereço com acento ou espaço ("Íris__Sinais") vai codificado; um já codificado (%C3%8D) fica igual. */
export const urlCodificada = (url: string) => (/[^\x21-\x7e]/.test(url) ? encodeURI(url) : url)
export type MensagemImagem = { numero: string; url: string; tipo: string; nomeArquivo: string; legenda: string }

/** Cliente do provedor de WhatsApp (Evolution API), com a chave no header apikey. */
@Injectable()
export class EvolutionClient {
  constructor(@Inject(AMBIENTE) private readonly ambiente: Ambiente) {}

  enviarTexto({ numero, texto }: MensagemTexto): Promise<void> {
    return this.postar(this.ambiente.whatsappSendUrl, { number: numero, text: texto })
  }

  enviarImagem({ numero, url, tipo, nomeArquivo, legenda }: MensagemImagem): Promise<void> {
    const endereco = this.ambiente.whatsappSendUrl && urlDeMidia(this.ambiente.whatsappSendUrl)
    return this.postar(endereco, {
      number: numero,
      mediatype: 'image',
      mimetype: tipo,
      caption: legenda,
      media: url.startsWith('http') ? urlCodificada(url) : url,
      fileName: nomeArquivo,
    })
  }

  private async postar(url: string | null, corpo: unknown): Promise<void> {
    const chave = this.ambiente.whatsappApiKey
    if (!chave) throw new ServiceUnavailableException('WHATSAPP_API_KEY não está configurada para envio de WhatsApp')
    if (!url) throw new ServiceUnavailableException('WHATSAPP_SEND_URL não está configurada para envio de WhatsApp')

    let resposta: Response
    try {
      resposta = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: chave },
        body: JSON.stringify(corpo),
      })
    } catch (erro) {
      throw new BadGatewayException(`O provedor de WhatsApp não respondeu: ${erro instanceof Error ? erro.message : String(erro)}`)
    }
    if (!resposta.ok) {
      // O motivo que o provedor deu (número inválido, chave errada, imagem que não baixa...), resumido.
      const motivo = (await resposta.text().catch(() => '')).slice(0, 500)
      throw new BadGatewayException(`O provedor de WhatsApp recusou (${resposta.status}): ${motivo || 'sem detalhes'}`)
    }
  }
}
