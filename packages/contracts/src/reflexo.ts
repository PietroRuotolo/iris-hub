// Jogo de reflexo: tipos trocados entre o site e o session-service, e a regra do resumo. A regra
// fica aqui (função pura) porque o site mostra o resumo na hora e o session-service recalcula os
// mesmos números a partir das tentativas, sem confiar nos que o site calculou.

export const ACIONAMENTOS_REFLEXO = ['MOUSE_CLICK', 'SPACE_KEY', 'ESP32_BUTTON'] as const
export type AcionamentoReflexo = (typeof ACIONAMENTOS_REFLEXO)[number]

/** Limite alto de propósito: só barra valores absurdos (bug ou entrada forjada), não jogadas lentas. */
export const TEMPO_MAXIMO_MS = 60_000
export const MAX_TENTATIVAS_REFLEXO = 200

export interface TentativaReflexo {
  /** 1, 2, 3...: a ordem em que as rodadas aconteceram. */
  rodada: number
  /** Da preparação até o sinal de reagir (ms). Em `queimou`, até a pessoa apertar antes da hora. */
  tempoEsperaMs: number
  /** Do sinal até o acionamento (ms). null quando queimou a largada. */
  tempoReacaoMs: number | null
  queimou: boolean
  acionamento: AcionamentoReflexo
}

export interface ResumoReflexo {
  /** Rodadas em que a pessoa reagiu depois do sinal. */
  validas: number
  queimadas: number
  tempoMedioMs: number | null
  melhorTempoMs: number | null
}

const arredondar2 = (v: number) => Math.round(v * 100) / 100

/** Só conta reação depois do sinal: queimar a largada não tem tempo de reação. */
export function resumirReflexo(tentativas: Pick<TentativaReflexo, 'queimou' | 'tempoReacaoMs'>[]): ResumoReflexo {
  const tempos = tentativas
    .filter((t) => !t.queimou && typeof t.tempoReacaoMs === 'number')
    .map((t) => t.tempoReacaoMs as number)
  return {
    validas: tempos.length,
    queimadas: tentativas.filter((t) => t.queimou).length,
    tempoMedioMs: tempos.length ? arredondar2(tempos.reduce((s, v) => s + v, 0) / tempos.length) : null,
    melhorTempoMs: tempos.length ? Math.min(...tempos) : null,
  }
}

export type StatusSessaoSimples = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'

export interface SessaoReflexo {
  id: string
  participanteId: string | null
  iniciadaEm: string // ISO 8601
  concluidaEm: string | null
  status: StatusSessaoSimples
  tempoMedioMs: number | null
  melhorTempoMs: number | null
  tentativas: TentativaReflexo[]
}
