// Partidas do jogo de ritmo pela API (/back → gateway → session-service), sempre do jogador escolhido
// (cabeçalho x-jogador-id, posto em http.ts). O site manda o que mediu em cada alvo; os pontos que
// ficam gravados são recalculados pelo serviço, com a mesma fórmula da tela.

import type { PartidaRitmoSalva, ResultadoAlvoSalvo, ResultadoTentativa, TentativaAlvo } from '@iris/contracts'
import { buscar, comRepeticao, postar } from './http'

/** Uma fase terminada, com os alvos como a partida mediu. */
export interface FaseJogada {
  fase: number
  /** Raio configurado (cm) e intervalo entre batidas (ms) da fase. */
  raioCm: number
  intervaloMs: number
  iniciadaEm: string // ISO 8601
  concluidaEm: string
  alvos: Omit<TentativaAlvo, 'fase' | 'pontuacao'>[]
}

/** Uma partida: o id é gerado no começo dela (cada partida jogada tem o seu). */
export interface PartidaJogada {
  id: string
  concluida: boolean
  iniciadaEm: string
  fases: FaseJogada[]
}

const RESULTADO: Record<ResultadoTentativa, ResultadoAlvoSalvo> = {
  ACERTO: 'hit',
  SEM_RESPOSTA: 'no_response',
  RASTREAMENTO_INSUFICIENTE: 'insufficient_tracking',
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const inteiro = (v: number | null) => (v === null ? {} : { valor: Math.max(0, Math.round(v)) })

/** O corpo de POST /rhythm-sessions (formato do serviço, em inglês). */
export function corpoDaPartida(partida: PartidaJogada) {
  return {
    id: partida.id,
    status: partida.concluida ? 'completed' : 'abandoned',
    startedAt: partida.iniciadaEm,
    phases: partida.fases.map((f) => ({
      phaseNumber: f.fase,
      targetRadiusCm: f.raioCm,
      beatIntervalMs: Math.round(f.intervaloMs),
      startedAt: f.iniciadaEm,
      finishedAt: f.concluidaEm,
      targets: f.alvos.map((a) => {
        const acerto = a.resultado === 'ACERTO'
        const latencia = inteiro(a.latenciaMs)
        const permanencia = inteiro(a.permanenciaMs)
        return {
          targetNumber: a.numeroAlvo,
          result: RESULTADO[a.resultado],
          byMagnet: acerto && Boolean(a.peloIma),
          targetX: limitar(a.alvoX, 0, 1),
          targetY: limitar(a.alvoY, 0, 1),
          targetRadiusPx: Math.max(1, a.raioPx),
          windowMs: Math.round(a.janelaMs),
          trackingCoverage: limitar(a.cobertura, 0, 1),
          ...('valor' in latencia ? { latencyMs: latencia.valor } : {}),
          // Entrada, permanência e distância só existem no acerto.
          ...(acerto && a.respostaEm
            ? { entryOffsetMs: limitar(Math.round(Date.parse(a.respostaEm) - Date.parse(a.batidaEm)), -a.janelaMs, a.janelaMs) }
            : {}),
          ...(acerto && 'valor' in permanencia ? { dwellTimeMs: permanencia.valor } : {}),
          ...(acerto && a.erroEspacial !== null ? { averageCenterDistancePx: a.erroEspacial * a.raioPx } : {}),
        }
      }),
    })),
  }
}

/**
 * Grava a partida inteira, quando ela termina (as 5 fases ou interrompida). Repete sozinha se o backend
 * estiver fora do ar; repetir é seguro, porque o mesmo id não é gravado duas vezes.
 */
export function salvarPartidaRitmo(partida: PartidaJogada): Promise<PartidaRitmoSalva> {
  return comRepeticao(() => postar<PartidaRitmoSalva>('/rhythm-sessions', corpoDaPartida(partida)))
}

/** As partidas do jogador, da mais recente para a mais antiga. */
export function listarPartidasRitmo(): Promise<PartidaRitmoSalva[]> {
  return buscar('/rhythm-sessions')
}
