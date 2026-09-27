import { BadGatewayException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'

@Injectable()
export class MicrosoftGraphClient {
  constructor(@Inject(AMBIENTE) private readonly ambiente: Ambiente) {}

  async enviar({ para, assunto, html }: { para: string; assunto: string; html: string }): Promise<void> {
    const { emailApiKey: accessToken, microsoftSendMailUrl: url } = this.ambiente
    if (!accessToken) {
      throw new ServiceUnavailableException('EMAIL_API_KEY não está configurada para envio de e-mails')
    }
    if (!url) {
      throw new ServiceUnavailableException('MICROSOFT_SEND_MAIL_URL não está configurada para envio de e-mails')
    }

    const resposta = await fetch(url, {
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
    }).catch(() => null)

    if (!resposta?.ok) {
      throw new BadGatewayException('Microsoft Graph não conseguiu enviar o e-mail')
    }
  }
}
