import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/**
 * Cliente HTTP do session-service para as rotas de calibrações. Só encaminha: validação e
 * persistência ficam no session-service.
 */
@Injectable()
export class CalibrationsClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'session-service', url: ambiente.sessionServiceUrl }
  }

  criar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/calibrations', corpo)
  }

  obter(id: string) {
    return encaminhar(this.servico, 'GET', `/calibrations/${encodeURIComponent(id)}`)
  }
}
