import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

@Injectable()
export class AuthClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'user-service', url: ambiente.userServiceUrl }
  }

  identificar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/auth/identify', corpo)
  }

  cadastrar(corpo: unknown) {
    return encaminhar(this.servico, 'POST', '/auth/register', corpo)
  }

  obterUsuario(authorization?: string) {
    return encaminhar(this.servico, 'GET', '/auth/me', undefined, authorization ? { authorization } : undefined)
  }

  marcarHistoriaVista(authorization?: string) {
    return encaminhar(this.servico, 'POST', '/auth/me/intro-seen', undefined, authorization ? { authorization } : undefined)
  }

  sair(authorization?: string) {
    return encaminhar(this.servico, 'POST', '/auth/logout', undefined, authorization ? { authorization } : undefined)
  }
}
