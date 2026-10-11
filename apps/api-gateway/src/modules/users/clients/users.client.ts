import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/** Cliente HTTP do user-service (contas dos jogadores). Só encaminha. */
@Injectable()
export class UsersClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'user-service', url: ambiente.userServiceUrl }
  }

  criar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/users', corpo)
  }

  buscar(busca: string, limite?: string) {
    const consulta = new URLSearchParams({ busca, ...(limite ? { limite } : {}) })
    return encaminhar(this.servico, 'GET', `/users?${consulta}`)
  }

  obter(id: string) {
    return encaminhar(this.servico, 'GET', `/users/${encodeURIComponent(id)}`)
  }
}
