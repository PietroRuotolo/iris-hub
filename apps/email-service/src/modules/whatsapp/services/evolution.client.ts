import { BadGatewayException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'

export type MensagemTexto = { numero: string; texto: string }
export type MensagemImagem = { numero: string; url: string; tipo: string; nomeArquivo: string; legenda: string }

/** Cliente do provedor de WhatsApp: o mesmo POST (WHATSAPP_SEND_URL) para texto e imagem, com o header apikey. */
@Injectable()
export class EvolutionClient {
  constructor(@Inject(AMBIENTE) private readonly ambiente: Ambiente) {}

  enviarTexto({ numero, texto }: MensagemTexto): Promise<void> {
    return this.postar({ number: numero, text: texto })
  }

  enviarImagem({ numero, url, tipo, nomeArquivo, legenda }: MensagemImagem): Promise<void> {
    return this.postar({
      number: numero,
      mediatype: 'image',
      mimetype: tipo,
      caption: legenda,
      media: url,
      fileName: nomeArquivo,
    })
  }

  private async postar(corpo: unknown): Promise<void> {
    const { whatsappSendUrl: url, whatsappApiKey: chave } = this.ambiente
    if (!chave) throw new ServiceUnavailableException('WHATSAPP_API_KEY não está configurada para envio de WhatsApp')
    if (!url) throw new ServiceUnavailableException('WHATSAPP_SEND_URL não está configurada para envio de WhatsApp')

    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: chave },
      body: JSON.stringify(corpo),
    }).catch(() => null)
    if (!resposta?.ok) throw new BadGatewayException('O provedor de WhatsApp não conseguiu enviar a mensagem')
  }
}
