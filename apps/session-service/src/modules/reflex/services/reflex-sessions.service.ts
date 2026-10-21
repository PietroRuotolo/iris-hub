import { Injectable } from '@nestjs/common'
import { ConflitoException, DadosInvalidosException, NaoEncontradoException } from '@iris/shared'
import type { CreateReflexSessionRequestDto } from '../dtos/request/create-reflex-session.request.dto.js'
import { ReflexSessionsRepository } from '../repositories/reflex-sessions.repository.js'
import { montarPartida, problemasDaPartida } from './regras.js'

const LIMITE_PADRAO = 20
const LIMITE_MAXIMO = 100

@Injectable()
export class ReflexSessionsService {
  constructor(private readonly repositorio: ReflexSessionsRepository) {}

  /**
   * Confere as regras, calcula o resultado e os pontos de cada fase e grava tudo junto. Cada partida
   * jogada é um documento novo; se o mesmo id chegar de novo (o site repetiu o envio), devolve a já gravada.
   */
  async criar(dados: CreateReflexSessionRequestDto, agora = new Date()) {
    const existente = await this.repositorio.buscarPorId(dados.id)
    if (existente) {
      if (existente.playerId !== dados.playerId) throw new ConflitoException('Esse id de partida já foi usado')
      return existente
    }
    const problemas = problemasDaPartida(dados)
    if (problemas.length > 0) throw new DadosInvalidosException(problemas)
    return this.repositorio.criar(montarPartida(dados, agora))
  }

  listar(playerId: string, limite?: number) {
    const n = Number.isInteger(limite) && limite! > 0 ? Math.min(limite!, LIMITE_MAXIMO) : LIMITE_PADRAO
    return this.repositorio.listarPorJogador(playerId, n)
  }

  /** A partida, se for desse jogador. De outro jogador responde igual a inexistente (404). */
  async obter(id: string, playerId: string | undefined) {
    const partida = await this.repositorio.buscarPorId(id)
    if (!partida || partida.playerId !== playerId) throw new NaoEncontradoException('Partida do reflexo', id)
    return partida
  }
}