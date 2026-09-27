import { timingSafeEqual } from 'node:crypto'
import { Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { Ambiente } from '@iris/config'
import { AMBIENTE, ROTA_PUBLICA } from '@iris/shared'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly chave: string

  constructor(
    private readonly reflector: Reflector,
    @Inject(AMBIENTE) ambiente: Ambiente,
  ) {
    if (!ambiente.apiKey) {
      throw new Error('API_KEY não definida: configure a chave no .env')
    }
    this.chave = ambiente.apiKey
  }

  canActivate(contexto: ExecutionContext): boolean {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [contexto.getHandler(), contexto.getClass()])
    if (publica) return true

    const recebida = contexto.switchToHttp().getRequest<Request>().header('x-api-key')
    const a = Buffer.from(recebida ?? '')
    const b = Buffer.from(this.chave)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Header x-api-key ausente ou inválido')
    }
    return true
  }
}
