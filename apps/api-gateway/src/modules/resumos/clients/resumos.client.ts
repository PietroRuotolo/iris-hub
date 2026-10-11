import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/** Cliente HTTP do session-service para o resumo compartilhado (QR code). Só encaminha. */
@Injectable()
export class ResumosClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'session-service', url: ambiente.sessionServiceUrl }
  }

  criar(participanteId: string, nome: string | null) {
    return encaminhar(this.servico, 'POST', '/resumos', { participanteId, nome })
  }

  obter(token: string) {
    return encaminhar(this.servico, 'GET', `/resumos/${encodeURIComponent(token)}`)
  }
}
