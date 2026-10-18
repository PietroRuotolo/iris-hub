// Ímã do olhar: perto o bastante de um alvo, a bolinha gruda no centro dele e o olhar conta como dentro.
// Evita perder o ponto por um erro pequeno da calibração. Para não tremer na borda, a bolinha só solta
// numa distância um pouco maior do que a que gruda. Lógica pura, testável.

import type { Ponto } from './features'

/** Força padrão do ímã do jogo: gruda a até 1,6 × o raio do alvo. */
export const FATOR_IMA_PADRAO = 1.6
/** Quanto a mais do raio de captura a bolinha precisa se afastar para soltar. */
export const FOLGA_SOLTURA = 0.3

/**
 * O fator do ímã a partir de NEXT_PUBLIC_IMA_FATOR (de 1 a 3). 1 desliga o ímã (gruda só dentro do
 * alvo); vazio ou inválido usa o padrão.
 */
export function lerFatorIma(valor: string | undefined): number {
  const numero = Number(valor)
  return valor && Number.isFinite(numero) && numero >= 1 && numero <= 3 ? numero : FATOR_IMA_PADRAO
}

export const FATOR_IMA = lerFatorIma(process.env.NEXT_PUBLIC_IMA_FATOR)

export interface Imantavel {
  cx: number
  cy: number
  /** Distância (px) em que gruda. */
  captura: number
  /** Distância (px) em que solta, se já estava grudado (≥ captura). */
  soltura: number
}

/** Os raios de captura e soltura de um alvo, pelo fator do ímã. */
export const raiosDoIma = (raio: number, fator = FATOR_IMA) => ({ captura: raio * fator, soltura: raio * (fator + (fator > 1 ? FOLGA_SOLTURA : 0)) })

/**
 * Onde desenhar o olhar: no centro do alvo mais próximo, se estiver dentro do alcance; senão, onde está.
 * `presoAntes` é o índice do alvo em que estava grudado (usa a distância de soltura para ele).
 */
export function grudarOlhar(olhar: Ponto | null, alvos: Imantavel[], presoAntes: number | null): { ponto: Ponto | null; preso: number | null } {
  if (!olhar) return { ponto: null, preso: null }
  let melhor: { i: number; d: number } | null = null
  alvos.forEach((a, i) => {
    const d = Math.hypot(olhar[0] - a.cx, olhar[1] - a.cy)
    const alcance = i === presoAntes ? a.soltura : a.captura
    if (d <= alcance && (!melhor || d < melhor.d)) melhor = { i, d }
  })
  if (!melhor) return { ponto: olhar, preso: null }
  const { i } = melhor as { i: number; d: number }
  return { ponto: [alvos[i].cx, alvos[i].cy], preso: i }
}
