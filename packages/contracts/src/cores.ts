// Jogo das cores (Genius com ESP32): tipos trocados entre o site e o session-service, e a regra do
// resumo. Cada rodada mostra uma sequência de cores, e a pessoa a repete nos botões do ESP32; a
// sequência cresce a cada acerto. O jogo acaba no primeiro erro.

export const MAX_RODADAS_CORES = 200
/** Limite alto de propósito: só barra valores absurdos, não jogadas lentas. */
export const TEMPO_RESPOSTA_MAXIMO_MS = 600_000

export interface RodadaCores {
  /** 1, 2, 3...: a ordem das rodadas na partida. */
  rodada: number
  /** Quantas cores a pessoa tinha de repetir. */
  tamanhoSequencia: number
  acertou: boolean
  /** Do início da vez da pessoa até o fim da rodada (ms). null se o site não conseguiu medir. */
  tempoRespostaMs: number | null
}

export interface ResumoCores {
  rodadasJogadas: number
  acertos: number
  /** A maior sequência repetida sem erro: é a medida de memória de trabalho do jogo. */
  maiorSequencia: number
  tempoRespostaMedioMs: number | null
}

/** Tempo médio só das rodadas que a pessoa acertou: no erro, o tempo mede a hesitação, não a resposta. */
export function resumirCores(rodadas: Pick<RodadaCores, 'tamanhoSequencia' | 'acertou' | 'tempoRespostaMs'>[]): ResumoCores {
  const certas = rodadas.filter((r) => r.acertou)
  const tempos = certas.map((r) => r.tempoRespostaMs).filter((t): t is number => typeof t === 'number')
  return {
    rodadasJogadas: rodadas.length,
    acertos: certas.length,
    maiorSequencia: certas.reduce((m, r) => Math.max(m, r.tamanhoSequencia), 0),
    tempoRespostaMedioMs: tempos.length ? Math.round((tempos.reduce((s, v) => s + v, 0) / tempos.length) * 100) / 100 : null,
  }
}

export interface SessaoCores {
  id: string
  participanteId: string | null
  iniciadaEm: string // ISO 8601
  concluidaEm: string | null
  status: 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  /** Pontuação que o ESP32 informou ao fim da partida (o site só repassa; o serviço não a recalcula). */
  pontuacaoFinal: number | null
  maiorSequencia: number | null
  tempoRespostaMedioMs: number | null
  rodadas: RodadaCores[]
}

// ---- Cores em 5 fases (o desafio rápido) --------------------------------------------------------
// Cada fase mostra uma sequência nova, uma cor a mais que a anterior (3, 4, 5, 6 e 7 cores), e a pessoa
// a repete. Errar (ou demorar) zera a fase, mas o jogo segue até a 5ª. As regras ficam aqui (funções
// puras) para o site mostrar os pontos na hora e o session-service recalcular os mesmos.

export const VERSAO_PONTUACAO_CORES = 'fases-v1'
/** Quantas cores (botões) o jogo tem. */
export const TOTAL_CORES = 5
export const TOTAL_FASES_CORES = 5
/** Tamanho da sequência de cada fase. */
export const TAMANHOS_FASES_CORES = [3, 4, 5, 6, 7] as const
/** Tempo para repetir, por cor da sequência: passou do total, a fase acaba (demorou). */
export const TEMPO_POR_COR_MS = 2500
/** Repetir neste ritmo (ms por cor) ou mais rápido vale os 100 pontos da fase. */
export const RITMO_IDEAL_POR_COR_MS = 400

/**
 * - acerto: repetiu a sequência inteira, na ordem, a tempo;
 * - errou: apertou uma cor fora da ordem;
 * - demorou: o tempo da fase acabou antes de terminar.
 */
export type ResultadoFaseCores = 'acerto' | 'errou' | 'demorou'

/** Uma fase como o site mediu. */
export interface FaseCores {
  /** 1 a 5. */
  numero: number
  /** As cores mostradas (0 a 4), na ordem. */
  sequencia: number[]
  /** As cores que a pessoa apertou, na ordem (para no primeiro erro). */
  apertos: number[]
  /** Do começo da vez da pessoa até o último aperto (ms). null se não apertou nada. */
  tempoRespostaMs: number | null
  resultado: ResultadoFaseCores
}

/** O resultado de uma fase, dados a sequência, o que a pessoa apertou e se o tempo acabou. */
export function avaliarFaseCores(sequencia: readonly number[], apertos: readonly number[], tempoAcabou: boolean): ResultadoFaseCores {
  const errou = apertos.some((cor, i) => cor !== sequencia[i])
  if (errou) return 'errou'
  if (apertos.length >= sequencia.length) return 'acerto'
  return tempoAcabou ? 'demorou' : 'errou'
}

/**
 * Pontos de uma fase (0 a 100, inteiros). O acerto vale de 60 a 100: 100 repetindo no ritmo ideal
 * (400 ms por cor) ou mais rápido, caindo até 60 no limite do tempo. Errar ou demorar vale 0.
 */
export function pontuarFaseCores(f: Pick<FaseCores, 'resultado' | 'tempoRespostaMs' | 'sequencia'>): number {
  if (f.resultado !== 'acerto' || f.tempoRespostaMs === null) return 0
  const porCor = f.tempoRespostaMs / Math.max(1, f.sequencia.length)
  const rapidez = Math.min(1, Math.max(0, (TEMPO_POR_COR_MS - porCor) / (TEMPO_POR_COR_MS - RITMO_IDEAL_POR_COR_MS)))
  return Math.round(60 + 40 * rapidez)
}

export interface ResumoFasesCores {
  fases: number
  acertos: number
  erros: number
  demoras: number
  /** A maior sequência repetida certa (0 se não acertou nenhuma). */
  maiorSequencia: number
  /** Média de ms por cor, só das fases certas. */
  ritmoMedioPorCorMs: number | null
  /** Soma dos pontos das fases (até 100 por fase: 0 a 500 numa partida completa). */
  pontos: number
}

/** O resumo da partida. */
export function resumirFasesCores(fases: Pick<FaseCores, 'resultado' | 'tempoRespostaMs' | 'sequencia'>[]): ResumoFasesCores {
  const certas = fases.filter((f) => f.resultado === 'acerto' && f.tempoRespostaMs !== null)
  const ritmos = certas.map((f) => (f.tempoRespostaMs as number) / f.sequencia.length)
  return {
    fases: fases.length,
    acertos: certas.length,
    erros: fases.filter((f) => f.resultado === 'errou').length,
    demoras: fases.filter((f) => f.resultado === 'demorou').length,
    maiorSequencia: certas.reduce((m, f) => Math.max(m, f.sequencia.length), 0),
    ritmoMedioPorCorMs: ritmos.length ? Math.round(ritmos.reduce((s, v) => s + v, 0) / ritmos.length) : null,
    pontos: fases.reduce((s, f) => s + pontuarFaseCores(f), 0),
  }
}

/** Uma partida das 5 fases: o id é gerado no começo dela (repetir o envio não duplica). */
export interface PartidaCores {
  id: string
  concluida: boolean
  /** Com o que a pessoa jogou: os botões do ESP32 ou o clique na tela (modo simulação). */
  acionamento: 'ESP32_BUTTON' | 'MOUSE_CLICK' | 'KEYBOARD'
  iniciadaEm: string // ISO 8601
  fases: FaseCores[]
}
