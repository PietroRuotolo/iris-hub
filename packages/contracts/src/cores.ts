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
