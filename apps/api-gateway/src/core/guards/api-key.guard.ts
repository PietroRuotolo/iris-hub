import { timingSafeEqual } from 'node:crypto'
import { Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { Ambiente } from '@iris/config'
import { AMBIENTE, ROTA_PUBLICA } from '@iris/shared'

export const HEADER_API_KEY = 'x-api-key'

/** Compara em tempo constante, para o tempo de resposta não revelar a chave. */
export function chaveConfere(recebida: string | undefined, esperada: string): boolean {
  if (!recebida) return false
  const a = Buffer.from(recebida)
  const b = Buffer.from(esperada)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Exige o header x-api-key com o valor de API_KEY em todas as rotas do gateway, exceto as
 * marcadas com @Publico() (ex.: GET /health). Sem API_KEY configurada, o gateway nem sobe.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly chave: string

  constructor(
    private readonly reflector: Reflector,
    @Inject(AMBIENTE) ambiente: Ambiente,
  ) {
    if (!ambiente.apiKey) {
      throw new Error('API_KEY não definida: coloque a chave do gateway no .env da raiz (veja o .env.example)')
    }
    this.chave = ambiente.apiKey
  }

  canActivate(contexto: ExecutionContext): boolean {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [contexto.getHandler(), contexto.getClass()])
    if (publica) return true

    const recebida = contexto.switchToHttp().getRequest<Request>().header(HEADER_API_KEY)
    if (!chaveConfere(recebida, this.chave)) {
      throw new UnauthorizedException(`Header ${HEADER_API_KEY} ausente ou inválido`)
    }
    return true
  }
}
