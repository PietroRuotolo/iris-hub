// Tamanho da área em que a calibração foi feita. O modelo prevê o olhar em px desse viewport: se
// ele muda (girar o aparelho, trocar de monitor), as previsões deixam de valer e é preciso calibrar
// de novo. Esticar as previsões para o tamanho novo seria errado: a tela física é que manda.

export interface Geometria {
  largura: number
  altura: number
}

/** Diferenças de arredondamento do navegador (barra de rolagem, zoom fracionário). */
export const TOLERANCIA_GEOMETRIA_PX = 2

export function mesmaGeometria(a: Geometria, b: Geometria): boolean {
  return Math.abs(a.largura - b.largura) <= TOLERANCIA_GEOMETRIA_PX && Math.abs(a.altura - b.altura) <= TOLERANCIA_GEOMETRIA_PX
}
