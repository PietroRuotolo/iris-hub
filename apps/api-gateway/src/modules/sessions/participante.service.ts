import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { UsersClient } from '../users/clients/users.client.js'

/** Cabeçalho com o id do jogador escolhido no site (não há login). */
export const HEADER_JOGADOR = 'x-jogador-id'

type RespostaJogador = { id?: unknown; nome?: unknown } | null

/**
 * Confere o jogador escolhido no site antes de qualquer rota de sessão: ele precisa existir no
 * user-service. Todas as rotas de sessão passam por aqui.
 */
@Injectable()
export class ParticipanteService {
  constructor(private readonly usuarios: UsersClient) {}

  /** O id do jogador, depois de conferir que a conta existe. 400 sem jogador; 404 se não existir. */
  async idDoJogador(jogadorId: string | undefined): Promise<string> {
    return (await this.jogador(jogadorId)).id
  }

  /** Id e nome do jogador. 400 sem jogador; 404 se a conta não existir. */
  async jogador(jogadorId: string | undefined): Promise<{ id: string; nome: string | null }> {
    if (!jogadorId) throw new BadRequestException('Escolha quem vai jogar')
    const { status, corpo } = await this.usuarios.obter(jogadorId)
    if (status === 404) throw new NotFoundException('Jogador não encontrado')
    const usuario = corpo as RespostaJogador
    if (status !== 200 || typeof usuario?.id !== 'string') throw new BadGatewayException('Não foi possível conferir o jogador')
    return { id: usuario.id, nome: typeof usuario.nome === 'string' ? usuario.nome : null }
  }
}

/** O participanteId do corpo sempre vem do jogador conferido, nunca do que o site mandou no corpo. */
export function comParticipante(corpo: unknown, participanteId: string): Record<string, unknown> {
  const base = typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo) ? corpo : {}
  return { ...base, participanteId }
}
