import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/**
 * Cliente HTTP do session-service para as rotas de sessões. Só encaminha: regras, persistência e
 * cálculos (ex.: o resumo) ficam no session-service.
 */
@Injectable()
export class SessionsClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'session-service', url: ambiente.sessionServiceUrl }
  }

  iniciar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/sessions', corpo)
  }

  finalizar(id: string, corpo: unknown) {
    return encaminhar(this.servico, 'POST', `/sessions/${encodeURIComponent(id)}/finish`, corpo)
  }

  obter(id: string) {
    return encaminhar(this.servico, 'GET', `/sessions/${encodeURIComponent(id)}`)
  }

  obterResumo(id: string) {
    return encaminhar(this.servico, 'GET', `/sessions/${encodeURIComponent(id)}/summary`)
  }
}
