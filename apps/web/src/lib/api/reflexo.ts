// Partidas do jogo do reflexo pela API (/back → gateway → session-service), sempre do jogador escolhido
// (cabeçalho x-jogador-id, posto em http.ts). O site manda só o que mediu em cada fase; o resultado e os
// pontos que ficam gravados são calculados pelo serviço, com as mesmas regras da tela.

import type { PartidaReflexo } from '@iris/contracts'
import { buscar, comRepeticao, postar } from './http'

/** A partida como ficou gravada (reflex_sessions, com as fases). */
export interface PartidaReflexoSalva {
  id: string
  status: 'completed' | 'abandoned'
  totalScore: number
  validAttempts: number
  averageTimeMs: number | null
  bestTimeMs: number | null
  startedAt: string
  attempts: { attemptNumber: number; command: 'press' | 'hold'; result: string; reactionTimeMs: number | null; score: number }[]
}

/** O corpo de POST /reflex-sessions (formato do serviço, em inglês). */
export function corpoDaPartida(partida: PartidaReflexo) {
  return {
    id: partida.id,
    status: partida.concluida ? 'completed' : 'abandoned',
    inputSource: partida.acionamento,
    startedAt: partida.iniciadaEm,
    attempts: partida.rodadas.map((r) => {
      const esperaMs = Math.round(r.esperaMs)
      return {
        attemptNumber: r.numero,
        command: r.ordem === 'apertar' ? 'press' : 'hold',
        waitTimeMs: esperaMs,
        windowMs: Math.round(r.janelaMs),
        // Um aperto colado na troca de tela pode cair um instante antes do começo da espera.
        pressedAfterMs: r.apertouAposMs === null ? null : Math.max(-esperaMs, Math.round(r.apertouAposMs)),
      }
    }),
  }
}

/**
 * Grava a partida inteira, quando ela termina (as 5 fases ou interrompida). Repete sozinha se o backend
 * estiver fora do ar; repetir é seguro, porque o mesmo id não é gravado duas vezes.
 */
export function salvarPartidaReflexo(partida: PartidaReflexo): Promise<PartidaReflexoSalva> {
  return comRepeticao(() => postar<PartidaReflexoSalva>('/reflex-sessions', corpoDaPartida(partida)))
}

/** As partidas do jogador, da mais recente para a mais antiga. */
export function listarPartidasReflexo(): Promise<PartidaReflexoSalva[]> {
  return buscar('/reflex-sessions')
}