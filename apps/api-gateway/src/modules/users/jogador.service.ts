import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { UsersClient } from './clients/users.client.js'

/** Cabeçalho com o id do jogador escolhido no site (não há login). */
export const HEADER_JOGADOR = 'x-jogador-id'

/**
 * Confere o jogador escolhido no site antes de qualquer rota de partida: a conta precisa existir no
 * user-service. 400 sem jogador; 404 se a conta não existir.
 */
@Injectable()
export class JogadorService {
  constructor(private readonly usuarios: UsersClient) {}

  async idDoJogador(jogadorId: string | undefined): Promise<string> {
    if (!jogadorId) throw new BadRequestException('Escolha quem vai jogar')
    const { status, corpo } = await this.usuarios.obter(jogadorId)
    if (status === 404) throw new NotFoundException('Jogador não encontrado')
    const id = (corpo as { id?: unknown } | null)?.id
    if (status !== 200 || typeof id !== 'string') throw new BadGatewayException('Não foi possível conferir o jogador')
    return id
  }
}
