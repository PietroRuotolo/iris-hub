import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthClient } from '../auth/clients/auth.client.js'

type RespostaMe = { usuario?: { id?: unknown } } | null

/**
 * Descobre quem está jogando pelo token de login (perguntando ao user-service). Todas as rotas de
 * sessão passam por aqui: o site nunca escolhe de quem é a sessão.
 */
@Injectable()
export class ParticipanteService {
  constructor(private readonly auth: AuthClient) {}

  /** O id da conta dona do token. 401 se não houver login ou ele estiver inválido ou expirado. */
  async doLogin(authorization: string | undefined): Promise<string> {
    if (!authorization) throw new UnauthorizedException('Faça login para jogar')
    const { status, corpo } = await this.auth.obterUsuario(authorization)
    const id = (corpo as RespostaMe)?.usuario?.id
    if (status !== 200 || typeof id !== 'string') throw new UnauthorizedException('Sessão de login inválida ou expirada')
    return id
  }
}

/** O participanteId do corpo sempre vem do login, nunca do que o site mandou. */
export function comParticipante(corpo: unknown, participanteId: string): Record<string, unknown> {
  const base = typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo) ? corpo : {}
  return { ...base, participanteId }
}
