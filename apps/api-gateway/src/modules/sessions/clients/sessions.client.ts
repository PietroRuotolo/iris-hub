import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/**
 * Cliente HTTP do session-service para as sessões do jogo. Só encaminha: validação, pontuação e
 * persistência ficam no session-service.
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

  obter(id: string, participanteId: string) {
    const query = new URLSearchParams({ participanteId })
    return encaminhar(this.servico, 'GET', `/sessions/${encodeURIComponent(id)}?${query}`)
  }

  registrarFase(id: string, corpo: unknown) {
    return encaminhar(this.servico, 'POST', `/sessions/${encodeURIComponent(id)}/phases`, corpo)
  }

  encerrar(id: string, corpo: unknown) {
    return encaminhar(this.servico, 'POST', `/sessions/${encodeURIComponent(id)}/finish`, corpo)
  }
}
