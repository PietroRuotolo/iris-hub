import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/** Cliente HTTP do session-service para as partidas das cores. Só encaminha. */
@Injectable()
export class ColorSessionsClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'session-service', url: ambiente.sessionServiceUrl }
  }

  criar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/color-sessions', corpo)
  }

  listar(playerId: string, limite?: string) {
    const consulta = new URLSearchParams({ playerId, ...(limite ? { limite } : {}) })
    return encaminhar(this.servico, 'GET', `/color-sessions?${consulta}`)
  }

  obter(id: string, playerId: string) {
    return encaminhar(this.servico, 'GET', `/color-sessions/${encodeURIComponent(id)}?${new URLSearchParams({ playerId })}`)
  }
}