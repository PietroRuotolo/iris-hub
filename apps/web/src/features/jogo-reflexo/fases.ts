// As 5 fases do "mestre mandou". Todas iguais: uma espera e uma ordem do mestre, "APERTE!" ou "NÃO
// APERTE!". Só muda qual das duas ordens sai, sorteada. Lógica pura: com o mesmo `aleatorio`, a mesma partida.

import type { OrdemMestre } from '@iris/contracts'

export const TOTAL_FASES = 5
/** Quantas das 5 fases são "NÃO APERTE!". */
export const FASES_NAO_APERTAR = 2
/** A espera antes da ordem é sorteada entre estes dois valores (ms). */
export const ESPERA_MS: [min: number, max: number] = [1500, 3500]
/** Tempo para apertar (ou para segurar) depois da ordem. */
export const JANELA_MS = 1500

export interface FasePlanejada {
  numero: number
  ordem: OrdemMestre
  esperaMs: number
  janelaMs: number
}

/**
 * As 5 fases, com as ordens embaralhadas. A primeira é sempre "APERTE!" (a pessoa entende o jogo antes
 * da primeira pegadinha).
 */
export function gerarFases(aleatorio: () => number = Math.random): FasePlanejada[] {
  const resto: OrdemMestre[] = [...Array(TOTAL_FASES - 1 - FASES_NAO_APERTAR).fill('apertar'), ...Array(FASES_NAO_APERTAR).fill('nao_apertar')]
  for (let i = resto.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1)) % (i + 1)
    ;[resto[i], resto[j]] = [resto[j], resto[i]]
  }
  const [min, max] = ESPERA_MS
  return (['apertar', ...resto] as OrdemMestre[]).map((ordem, i) => ({
    numero: i + 1,
    ordem,
    esperaMs: Math.round(min + aleatorio() * (max - min)),
    janelaMs: JANELA_MS,
  }))
}