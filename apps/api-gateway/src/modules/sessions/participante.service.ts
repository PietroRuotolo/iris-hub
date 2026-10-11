import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthClient } from '../auth/clients/auth.client.js'

type RespostaMe = { usuario?: { id?: unknown; nome?: unknown } } | null

/**
 * Descobre quem está jogando pelo token de login (perguntando ao user-service). Todas as rotas de
 * sessão passam por aqui: o site nunca escolhe de quem é a sessão.
 */
@Injectable()
export class ParticipanteService {
  constructor(private readonly auth: AuthClient) {}

  /** O id da conta dona do token. 401 se não houver login ou ele estiver inválido ou expirado. */
  async doLogin(authorization: string | undefined): Promise<string> {
    return (await this.pessoaDoLogin(authorization)).id
  }

  /** Id e nome da conta dona do token. 401 se não houver login ou ele estiver inválido ou expirado. */
  async pessoaDoLogin(authorization: string | undefined): Promise<{ id: string; nome: string | null }> {
    if (!authorization) throw new UnauthorizedException('Faça login para jogar')
    const { status, corpo } = await this.auth.obterUsuario(authorization)
    const usuario = (corpo as RespostaMe)?.usuario
    if (status !== 200 || typeof usuario?.id !== 'string') throw new UnauthorizedException('Sessão de login inválida ou expirada')
    return { id: usuario.id, nome: typeof usuario.nome === 'string' ? usuario.nome : null }
  }
}

/** O participanteId do corpo sempre vem do login, nunca do que o site mandou. */
export function comParticipante(corpo: unknown, participanteId: string): Record<string, unknown> {
  const base = typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo) ? corpo : {}
  return { ...base, participanteId }
}
