// Contratos compartilhados entre o front-end (apps/web) e os serviços (apps/*).
// Só tipos e constantes: nada aqui depende de framework.

/** Participante que joga (pode existir sem login). */
export interface Participante {
  id: string
  apelido: string
  criadoEm: string // ISO 8601
}

/** Resultado de uma calibração do rastreamento ocular. */
export interface Calibracao {
  id: string
  participanteId: string | null
  realizadaEm: string // ISO 8601
  pontosCalibracao: number
  erroMedioPx: number | null
  erroMedioFracaoTela: number | null
  tela: { larguraPx: number; alturaPx: number }
}

export const TIPOS_EVENTO_JOGO = ['alvo-apresentado', 'acerto', 'erro', 'piscada'] as const
export type TipoEventoJogo = (typeof TIPOS_EVENTO_JOGO)[number]

/** Evento registrado durante uma sessão do jogo de ritmo. */
export interface EventoJogo {
  tipo: TipoEventoJogo
  instanteMs: number // desde o início da sessão
  alvoId?: string
  tempoRespostaMs?: number
  precisaoPx?: number
}

export const STATUS_SESSAO = ['em-andamento', 'concluida', 'cancelada'] as const
export type StatusSessao = (typeof STATUS_SESSAO)[number]

/** Uma sessão do jogo de ritmo. */
export interface Sessao {
  id: string
  participanteId: string | null
  calibracaoId: string
  iniciadaEm: string // ISO 8601
  concluidaEm: string | null
  status: StatusSessao
}

/** Resumo calculado de uma sessão ao finalizá-la (futuramente, pelo analytics-worker). */
export interface ResumoSessao {
  sessaoId: string
  acertos: number
  erros: number
  taxaAcerto: number | null
  tempoRespostaMedioMs: number | null
  tempoRespostaDesvioPadraoMs: number | null
  precisaoMediaPx: number | null
  /** Desvio-padrão da precisão entre os acertos: quanto o olhar varia em torno do alvo. */
  variabilidadeFixacaoPx: number | null
}

/** Filas de mensagens entre os serviços. */
export const FILAS = {
  /** session-service publica quando uma sessão termina; analytics-worker consome e gera o resumo. */
  sessaoConcluida: 'sessao.concluida',
} as const

export interface MensagemSessaoConcluida {
  sessaoId: string
  concluidaEm: string
}
