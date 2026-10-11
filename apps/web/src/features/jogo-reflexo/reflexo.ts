export type FaixaReflexo = 'excelente' | 'bom' | 'regular' | 'lento'

export const ROTULO_FAIXA: Record<FaixaReflexo, string> = {
  excelente: 'Excelente',
  bom: 'Bom',
  regular: 'Regular',
  lento: 'Podia ser mais rápido',
}

export function classificarTempo(tempoMs: number): FaixaReflexo {
  if (tempoMs < 200) return 'excelente'
  if (tempoMs < 350) return 'bom'
  if (tempoMs < 500) return 'regular'
  return 'lento'
}

export function tempoDeEsperaMs(
  min = 2000,
  max = 5000,
  aleatorio: () => number = Math.random
): number {
  return Math.round(min + aleatorio() * (max - min))
}