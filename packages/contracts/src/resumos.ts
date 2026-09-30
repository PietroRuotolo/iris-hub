// Resumo compartilhado: o link (aberto pelo QR code no celular, sem login) com a última partida
// encerrada de cada jogo da pessoa. O banco guarda só o hash do token e os ids das sessões escolhidas
// no momento em que o QR code foi gerado: o que a pessoa jogar depois não muda o resumo já entregue.

import type { SessaoCores } from './cores.js'
import type { SessaoReflexo } from './reflexo.js'
import type { SessaoJogo } from './sessoes.js'

/** Por quanto tempo o link do QR code abre o resumo. */
export const DIAS_VALIDADE_RESUMO = 7

/** Resposta de `POST /resumos`: o token só aparece aqui (o banco guarda o hash). */
export interface ResumoCriado {
  token: string
  expiraEm: string // ISO 8601
  /** Quais sessões entraram no resumo (null: o jogo não tem partida encerrada). */
  sessoes: { ritmo: string | null; reflexo: string | null; cores: string | null }
}

/** Resposta de `GET /resumos/:token`: as sessões completas, para o celular montar o resumo. */
export interface ResumoCompartilhado {
  /** Primeiro nome da pessoa, para o cabeçalho do resumo. */
  nome: string | null
  criadoEm: string // ISO 8601
  expiraEm: string // ISO 8601
  ritmo: SessaoJogo | null
  reflexo: SessaoReflexo | null
  cores: SessaoCores | null
}

/** Só o primeiro nome vai para o link compartilhado. */
export function primeiroNome(nome: string | null | undefined): string | null {
  const primeiro = nome?.trim().split(/\s+/)[0]
  return primeiro ? primeiro.slice(0, 40) : null
}
