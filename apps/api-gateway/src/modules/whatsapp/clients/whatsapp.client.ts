import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/** Cliente HTTP do envio de WhatsApp (no email-service). Só encaminha, com a x-api-key interna. */
@Injectable()
export class WhatsappClient {
  private readonly servico: { nome: string; url: string }
  private readonly cabecalhos: Record<string, string>

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'email-service', url: ambiente.emailServiceUrl }
    this.cabecalhos = ambiente.apiKey ? { 'x-api-key': ambiente.apiKey } : {}
  }

  enviar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/whatsapp/send', corpo, this.cabecalhos)
  }
}
