// Partidas do jogo das cores pela API (/back → gateway → session-service), sempre do jogador escolhido
// (cabeçalho x-jogador-id, posto em http.ts). O site manda só o que mediu em cada fase; o resultado e os
// pontos que ficam gravados são calculados pelo serviço, com as mesmas regras da tela.

import type { PartidaCores } from '@iris/contracts'
import { buscar, comRepeticao, postar } from './http'

/** A partida como ficou gravada (color_sessions, com as fases). */
export interface PartidaCoresSalva {
  id: string
  status: 'completed' | 'abandoned'
  score: number
  roundsCompleted: number
  maxSequenceLength: number
  averageMsPerColor: number | null
  startedAt: string
  rounds: { roundNumber: number; expectedSequence: number[]; playerSequence: number[]; result: string; responseTimeMs: number | null; score: number }[]
}

/** O corpo de POST /color-sessions (formato do serviço, em inglês). */
export function corpoDaPartidaCores(partida: PartidaCores) {
  return {
    id: partida.id,
    status: partida.concluida ? 'completed' : 'abandoned',
    inputSource: partida.acionamento,
    startedAt: partida.iniciadaEm,
    rounds: partida.fases.map((f) => ({
      roundNumber: f.numero,
      expectedSequence: f.sequencia,
      playerSequence: f.apertos,
      responseTimeMs: f.tempoRespostaMs === null ? null : Math.round(f.tempoRespostaMs),
    })),
  }
}

/**
 * Grava a partida inteira, quando ela termina (as 5 fases ou interrompida). Repete sozinha se o backend
 * estiver fora do ar; repetir é seguro, porque o mesmo id não é gravado duas vezes.
 */
export function salvarPartidaCores(partida: PartidaCores): Promise<PartidaCoresSalva> {
  return comRepeticao(() => postar<PartidaCoresSalva>('/color-sessions', corpoDaPartidaCores(partida)))
}

/** As partidas do jogador, da mais recente para a mais antiga. */
export function listarPartidasCores(): Promise<PartidaCoresSalva[]> {
  return buscar('/color-sessions')
}