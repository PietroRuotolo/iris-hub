import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

@Injectable()
export class EmailsClient {
  private readonly servico: { nome: string; url: string }
  private readonly cabecalhos: Record<string, string>

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'email-service', url: ambiente.emailServiceUrl }
    this.cabecalhos = ambiente.apiKey ? { 'x-api-key': ambiente.apiKey } : {}
  }

  enviar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/emails/send', corpo, this.cabecalhos)
  }
}
