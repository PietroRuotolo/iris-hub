import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/** Cliente HTTP do session-service para o ranking. Só encaminha. */
@Injectable()
export class RankingClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'session-service', url: ambiente.sessionServiceUrl }
  }

  geral(limite?: string) {
    return encaminhar(this.servico, 'GET', `/ranking${limite ? `?${new URLSearchParams({ limite })}` : ''}`)
  }
}