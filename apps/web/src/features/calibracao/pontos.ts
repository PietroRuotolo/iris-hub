// Posições normalizadas (0..1) dos pontos de calibração e de conferência. Os de conferência não
// coincidem com os de calibração; senão o erro medido sairia otimista.

export interface PontoTela {
  x: number
  y: number
}

export const PONTOS_CALIBRACAO: PontoTela[] = [0.1, 0.5, 0.9].flatMap((y) => [0.1, 0.5, 0.9].map((x) => ({ x, y })))

/** Conferência depois da calibração: centro e os quatro quadrantes, com a bolinha do olhar visível. */
export const PONTOS_CONFERENCIA: PontoTela[] = [
  { x: 0.5, y: 0.5 },
  { x: 0.2, y: 0.25 },
  { x: 0.8, y: 0.25 },
  { x: 0.8, y: 0.75 },
  { x: 0.2, y: 0.75 },
]

export function embaralhar<T>(lista: T[], aleatorio: () => number = Math.random): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
