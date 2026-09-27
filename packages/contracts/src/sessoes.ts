// Sessão do jogo de ritmo: tipos trocados entre o site e o session-service, e a regra de
// pontuação. A regra fica aqui (função pura) porque o site mostra os pontos na hora e o
// session-service recalcula e guarda os mesmos pontos a partir das tentativas.

/** Versão da fórmula de pontuação: fica gravada na sessão para comparar sessões se a regra mudar. */
export const VERSAO_PONTUACAO = 'v1'

/** Janela de acerto em torno da batida (±ms) e tempo mínimo com o olhar sobre o alvo. */
export const JANELA_ACERTO_MS = 500
export const PERMANENCIA_MINIMA_MS = 250

export const STATUS_SESSAO = ['EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'] as const
export type StatusSessao = (typeof STATUS_SESSAO)[number]

export const RESULTADOS_TENTATIVA = ['ACERTO', 'SEM_RESPOSTA', 'RASTREAMENTO_INSUFICIENTE'] as const
export type ResultadoTentativa = (typeof RESULTADOS_TENTATIVA)[number]

export const FASES_JOGO = [
  { fase: 1, nome: 'Familiarização' },
  { fase: 2, nome: 'Ritmo constante' },
  { fase: 3, nome: 'Alternância' },
  { fase: 4, nome: 'Precisão e velocidade' },
  { fase: 5, nome: 'Desafio final' },
] as const

export interface TelaSessao {
  larguraPx: number
  alturaPx: number
  /** Diagonal escolhida em Configurações e a escala resultante. */
  polegadas: number | null
  pxPorCm: number | null
}

export interface CalibracaoSessao {
  pontos: number
  /** Erro médio na validação, em px. */
  erroMedioPx: number | null
  /** 0 a 1: 1 = sem erro; cai conforme o erro cresce em relação à tela. */
  qualidade: number | null
  /** 0 a 1: fração do tempo da calibração com o rosto detectado. */
  coberturaValida: number | null
  /** Distância mediana da pessoa à câmera na calibração (cm, estimada pela íris). */
  distanciaMediaCm: number | null
  /** Óculos detectados pela armação (estimativa); null se não deu para medir. */
  oculos: boolean | null
  /** 0 a 1: fração das leituras da calibração com reflexo nos olhos. */
  fracaoReflexo: number | null
  /** A pessoa escolheu calibrar ignorando o reflexo (precisão menor). */
  reflexoIgnorado: boolean
}

/** Um alvo apresentado, como o site mediu. Posições normalizadas (0 a 1) na tela. */
export interface TentativaAlvo {
  fase: number
  numeroAlvo: number
  alvoX: number
  alvoY: number
  raioPx: number
  janelaMs: number
  apresentadoEm: string // ISO 8601
  batidaEm: string // ISO 8601
  respostaEm: string | null
  resultado: ResultadoTentativa
  /** Da aparição do alvo até o olhar entrar nele. */
  latenciaMs: number | null
  /** |entrada do olhar − batida|. */
  erroTempoMs: number | null
  /** Distância média do olhar ao centro durante a permanência, dividida pelo raio (0 = no centro). */
  erroEspacial: number | null
  permanenciaMs: number | null
  /** 0 a 1: fração do tempo do alvo com o olhar rastreado. */
  cobertura: number
  /** Desvio médio do olhar em relação ao alvo na janela da batida (px; + = direita/baixo). */
  desvioXPx: number | null
  desvioYPx: number | null
  pontuacao: number
}

export interface FaseResumo {
  fase: number
  nome: string
  alvosApresentados: number
  acertos: number
  semResposta: number
  rastreamentoInsuficiente: number
  /** Média dos pontos dos alvos válidos (0 a 100). */
  pontuacao: number
  coberturaRastreamento: number | null
}

export interface SessaoJogo {
  id: string
  participanteId: string | null
  iniciadaEm: string
  concluidaEm: string | null
  status: StatusSessao
  tela: TelaSessao
  calibracao: CalibracaoSessao | null
  fases: FaseResumo[]
  /** Média das fases jogadas (0 a 100). */
  pontuacaoTotal: number | null
  coberturaTotal: number | null
  versaoPontuacao: string
}

const limitar01 = (v: number) => Math.min(1, Math.max(0, v))
const media = (valores: number[]) => valores.reduce((s, v) => s + v, 0) / valores.length

/**
 * Pontos de um alvo (0 a 100). Só acerto pontua:
 * 50 + 30 × notaTempo + 20 × notaPrecisao, com notaTempo = 1 − erroTempo/janela e
 * notaPrecisao = 1 − d/R (cada nota limitada a 0..1).
 */
export function pontuarTentativa(t: Pick<TentativaAlvo, 'resultado' | 'erroTempoMs' | 'janelaMs' | 'erroEspacial'>): number {
  if (t.resultado !== 'ACERTO') return 0
  const notaTempo = t.erroTempoMs === null || t.janelaMs <= 0 ? 0 : limitar01(1 - t.erroTempoMs / t.janelaMs)
  const notaPrecisao = t.erroEspacial === null ? 0 : limitar01(1 - t.erroEspacial)
  return Math.round((50 + 30 * notaTempo + 20 * notaPrecisao) * 10) / 10
}

/** Resumo de uma fase. Alvos com rastreamento insuficiente não entram na pontuação (nem como erro). */
export function resumirFase(
  fase: number,
  nome: string,
  tentativas: Pick<TentativaAlvo, 'resultado' | 'erroTempoMs' | 'janelaMs' | 'erroEspacial' | 'cobertura'>[],
): FaseResumo {
  const validas = tentativas.filter((t) => t.resultado !== 'RASTREAMENTO_INSUFICIENTE')
  const pontos = validas.map(pontuarTentativa)
  return {
    fase,
    nome,
    alvosApresentados: tentativas.length,
    acertos: tentativas.filter((t) => t.resultado === 'ACERTO').length,
    semResposta: tentativas.filter((t) => t.resultado === 'SEM_RESPOSTA').length,
    rastreamentoInsuficiente: tentativas.length - validas.length,
    pontuacao: pontos.length ? Math.round(media(pontos) * 10) / 10 : 0,
    coberturaRastreamento: tentativas.length ? Math.round(media(tentativas.map((t) => t.cobertura)) * 1000) / 1000 : null,
  }
}

/** Pontuação geral e cobertura da sessão: média das fases jogadas. */
export function resumirSessao(fases: Pick<FaseResumo, 'pontuacao' | 'coberturaRastreamento'>[]): {
  pontuacaoTotal: number | null
  coberturaTotal: number | null
} {
  if (fases.length === 0) return { pontuacaoTotal: null, coberturaTotal: null }
  const coberturas = fases.map((f) => f.coberturaRastreamento).filter((c): c is number => c !== null)
  return {
    pontuacaoTotal: Math.round(media(fases.map((f) => f.pontuacao)) * 10) / 10,
    coberturaTotal: coberturas.length ? Math.round(media(coberturas) * 1000) / 1000 : null,
  }
}
