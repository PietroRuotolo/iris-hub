// As 5 fases do jogo das cores: em cada uma, uma sequência nova com uma cor a mais (3, 4, 5, 6 e 7) e
// as luzes um pouco mais rápidas. Lógica pura: com o mesmo `aleatorio`, a mesma partida.

import { TAMANHOS_FASES_CORES, TEMPO_POR_COR_MS, TOTAL_CORES, TOTAL_FASES_CORES } from '@iris/contracts'

export const TOTAL_FASES = TOTAL_FASES_CORES
/** Quanto tempo cada cor da sequência leva para ser mostrada, por fase (ms): acesa + apagada. */
export const PASSO_MOSTRAR_MS = [800, 720, 640, 570, 500] as const
/** Da passada de cada cor, quanto ela fica acesa. */
export const PARTE_ACESA = 0.65

export interface FaseCoresPlanejada {
  numero: number
  sequencia: number[]
  /** Quanto tempo cada cor leva para ser mostrada. */
  passoMs: number
  /** O tempo que a pessoa tem para repetir a sequência inteira. */
  limiteMs: number
}

/** Uma sequência de `tamanho` cores, sem a mesma cor duas vezes seguidas (para dar para ver as duas). */
export function sortearSequencia(tamanho: number, aleatorio: () => number = Math.random): number[] {
  const sequencia: number[] = []
  while (sequencia.length < tamanho) {
    const cor = Math.floor(aleatorio() * TOTAL_CORES) % TOTAL_CORES
    if (cor !== sequencia.at(-1)) sequencia.push(cor)
    else sequencia.push((cor + 1) % TOTAL_CORES)
  }
  return sequencia
}

export function gerarFasesCores(aleatorio: () => number = Math.random): FaseCoresPlanejada[] {
  return TAMANHOS_FASES_CORES.map((tamanho, i) => ({
    numero: i + 1,
    sequencia: sortearSequencia(tamanho, aleatorio),
    passoMs: PASSO_MOSTRAR_MS[i],
    limiteMs: tamanho * TEMPO_POR_COR_MS,
  }))
}