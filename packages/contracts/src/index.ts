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
