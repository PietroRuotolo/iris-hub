import { BadGatewayException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'

/** Cabeçalhos da resposta do Graph que ajudam a achar o erro (o request-id serve para o suporte da Microsoft). */
const CABECALHOS_UTEIS = ['request-id', 'client-request-id', 'x-ms-ags-diagnostic', 'www-authenticate', 'retry-after', 'date']

@Injectable()
export class MicrosoftGraphClient {
  private readonly log = new Logger(MicrosoftGraphClient.name)

  constructor(@Inject(AMBIENTE) private readonly ambiente: Ambiente) {}

  async enviar({ para, assunto, html }: { para: string; assunto: string; html: string }): Promise<void> {
    const { emailApiKey: accessToken, microsoftSendMailUrl: url } = this.ambiente
    if (!accessToken) {
      throw new ServiceUnavailableException('EMAIL_API_KEY não está configurada para envio de e-mails')
    }
    if (!url) {
      throw new ServiceUnavailableException('MICROSOFT_SEND_MAIL_URL não está configurada para envio de e-mails')
    }

    let resposta: Response
    try {
      resposta = await fetch(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          message: {
            subject: assunto,
            body: { contentType: 'HTML', content: html },
            toRecipients: [{ emailAddress: { address: para } }],
          },
          saveToSentItems: true,
        }),
      })
    } catch (erro) {
      const motivo = erro instanceof Error ? `${erro.name}: ${erro.message}${erro.cause ? ` (${String(erro.cause)})` : ''}` : String(erro)
      this.log.error(`Microsoft Graph não respondeu (POST ${url}): ${motivo}`)
      throw new BadGatewayException(`Microsoft Graph não respondeu: ${motivo}`)
    }

    if (!resposta.ok) {
      // Tudo o que o Graph respondeu (nunca o token): status, cabeçalhos de diagnóstico e o corpo inteiro.
      const corpo = await resposta.text().catch(() => '')
      const cabecalhos = Object.fromEntries(CABECALHOS_UTEIS.flatMap((nome) => (resposta.headers.has(nome) ? [[nome, resposta.headers.get(nome)]] : [])))
      this.log.error(
        `Microsoft Graph recusou o e-mail: ${resposta.status} ${resposta.statusText} | POST ${url} | para ${para} | cabeçalhos ${JSON.stringify(cabecalhos)} | corpo ${corpo || '(vazio)'}`,
      )
      throw new BadGatewayException(`Microsoft Graph recusou (${resposta.status}): ${corpo.slice(0, 500) || resposta.statusText || 'sem detalhes'}`)
    }
    this.log.log(`E-mail enviado pelo Microsoft Graph para ${para} (${resposta.status})`)
  }
}
