// Jogo do reflexo, "o mestre mandou": tipos trocados entre o site e o session-service, e as regras de
// cada rodada e da pontuação. Ficam aqui (funções puras) porque o site mostra os números na hora e o
// session-service vai recalcular os mesmos a partir das rodadas, sem confiar nos do site.
//
// Cada rodada tem uma espera (a pessoa não pode apertar) e depois a ordem do mestre: "APERTE!" (aperta o
// mais rápido que puder) ou "NÃO APERTE!" (segura até o tempo acabar). Mede o tempo de reação e o
// controle de não apertar quando não deve.

export const VERSAO_PONTUACAO_REFLEXO = 'mestre-v1'

export const ACIONAMENTOS_REFLEXO = ['ESP32_BUTTON', 'SPACE_KEY', 'MOUSE_CLICK'] as const
export type AcionamentoReflexo = (typeof ACIONAMENTOS_REFLEXO)[number]

/** Abaixo disto, a resposta é rápida demais para ser reação à ordem: conta como antecipação. */
export const TEMPO_MINIMO_REACAO_MS = 100
/** Reação no mínimo humano: vale os 100 pontos. */
export const TEMPO_REACAO_IDEAL_MS = 150
/** Limite alto de propósito: só barra valores absurdos (bug ou entrada forjada). */
export const TEMPO_MAXIMO_MS = 60_000

/** A ordem do mestre: apertar ou não apertar. */
export type OrdemMestre = 'apertar' | 'nao_apertar'

/**
 * - acerto: o mestre mandou apertar e a pessoa apertou a tempo;
 * - segurou: o mestre mandou não apertar e a pessoa segurou;
 * - atrasado: mandou apertar e o tempo acabou;
 * - apertou_errado: mandou não apertar e a pessoa apertou;
 * - antecipacao: apertou antes da ordem, ou rápido demais para ter lido (< 100 ms).
 */
export type ResultadoRodada = 'acerto' | 'segurou' | 'atrasado' | 'apertou_errado' | 'antecipacao'

export const RESULTADOS_CERTOS: readonly ResultadoRodada[] = ['acerto', 'segurou']

/** Uma rodada como o site mediu. Tempos em ms. */
export interface RodadaReflexo {
  /** 1, 2, 3...: a ordem da rodada na partida. */
  numero: number
  ordem: OrdemMestre
  /** Espera sorteada antes da ordem. */
  esperaMs: number
  /** Tempo para apertar (ou para segurar) depois da ordem. */
  janelaMs: number
  resultado: ResultadoRodada
  /** Da ordem ao botão; null se não apertou ou se apertou antes da ordem. */
  tempoReacaoMs: number | null
}

/** O resultado de uma rodada, dada a ordem e quando a pessoa apertou. */
export function avaliarRodada(
  ordem: OrdemMestre,
  /** ms da ordem até o botão: negativo = apertou na espera; null = não apertou. */
  apertouAposMs: number | null,
  janelaMs: number,
): { resultado: ResultadoRodada; tempoReacaoMs: number | null } {
  if (apertouAposMs !== null && apertouAposMs < 0) return { resultado: 'antecipacao', tempoReacaoMs: null }
  const apertou = apertouAposMs !== null && apertouAposMs <= janelaMs
  if (!apertou) return { resultado: ordem === 'apertar' ? 'atrasado' : 'segurou', tempoReacaoMs: null }
  const tempo = Math.round(apertouAposMs)
  if (tempo < TEMPO_MINIMO_REACAO_MS) return { resultado: 'antecipacao', tempoReacaoMs: tempo }
  return { resultado: ordem === 'apertar' ? 'acerto' : 'apertou_errado', tempoReacaoMs: tempo }
}

/**
 * Pontos de uma rodada (0 a 100). Segurar quando o mestre mandou não apertar vale 100. O acerto vale de
 * 60 a 100: 100 com a reação no mínimo humano (150 ms), caindo até 60 no fim do tempo. Erros valem 0.
 */
export function pontuarRodada(r: Pick<RodadaReflexo, 'resultado' | 'tempoReacaoMs' | 'janelaMs'>): number {
  if (r.resultado === 'segurou') return 100
  if (r.resultado !== 'acerto' || r.tempoReacaoMs === null) return 0
  const rapidez = Math.min(1, Math.max(0, (r.janelaMs - r.tempoReacaoMs) / Math.max(1, r.janelaMs - TEMPO_REACAO_IDEAL_MS)))
  return Math.round((60 + 40 * rapidez) * 10) / 10
}

export interface ResumoReflexo {
  rodadas: number
  acertos: number
  segurou: number
  atrasados: number
  apertouErrado: number
  antecipacoes: number
  /** Rodadas certas (acerto + segurou) / rodadas (0 a 1). */
  precisao: number | null
  /** Só dos acertos (as rodadas em que o mestre mandou apertar). */
  tempoMedioMs: number | null
  melhorTempoMs: number | null
  /** Desvio padrão dos tempos: o quanto a reação varia. */
  desvioPadraoMs: number | null
  /** Soma dos pontos das rodadas (até 100 por rodada). */
  pontos: number
}

const arredondar = (v: number, casas = 1) => Math.round(v * 10 ** casas) / 10 ** casas
const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length

/** O resumo de um conjunto de rodadas (a partida inteira). */
export function resumirReflexo(rodadas: Pick<RodadaReflexo, 'resultado' | 'tempoReacaoMs' | 'janelaMs'>[]): ResumoReflexo {
  const conta = (r: ResultadoRodada) => rodadas.filter((x) => x.resultado === r).length
  const tempos = rodadas.filter((r) => r.resultado === 'acerto' && r.tempoReacaoMs !== null).map((r) => r.tempoReacaoMs as number)
  const m = tempos.length ? media(tempos) : null
  return {
    rodadas: rodadas.length,
    acertos: conta('acerto'),
    segurou: conta('segurou'),
    atrasados: conta('atrasado'),
    apertouErrado: conta('apertou_errado'),
    antecipacoes: conta('antecipacao'),
    precisao: rodadas.length ? arredondar((conta('acerto') + conta('segurou')) / rodadas.length, 3) : null,
    tempoMedioMs: m === null ? null : arredondar(m),
    melhorTempoMs: tempos.length ? Math.min(...tempos) : null,
    desvioPadraoMs: m !== null && tempos.length > 1 ? arredondar(Math.sqrt(media(tempos.map((t) => (t - m) ** 2)))) : null,
    pontos: arredondar(rodadas.reduce((s, r) => s + pontuarRodada(r), 0)),
  }
}

/** Uma partida: o id é gerado no começo dela (repetir o envio não duplica). Cada fase é uma rodada. */
export interface PartidaReflexo {
  id: string
  concluida: boolean
  acionamento: AcionamentoReflexo
  iniciadaEm: string // ISO 8601
  rodadas: RodadaReflexo[]
}