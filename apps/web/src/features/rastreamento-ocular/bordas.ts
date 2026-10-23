// A bolinha do olhar nunca sai da tela: quando o modelo estima um ponto fora dela, a bolinha fica
// encostada na borda mais próxima. Só para o desenho: a avaliação dos alvos, o desvio e os ajustes da
// calibração usam o olhar estimado de verdade (fora da tela, ele já está fora de qualquer alvo).

import type { Ponto } from './features'

export interface PontoNaTela {
  ponto: Ponto
  /** O olhar estimado estava fora da tela (a bolinha foi segurada na borda). */
  fora: boolean
}

/** O ponto limitado a [margem, lado − margem] em cada eixo; `margem` = raio da bolinha, para ela aparecer inteira. */
export function manterNaTela(ponto: Ponto | null, tela: { largura: number; altura: number }, margem = 0): PontoNaTela | null {
  if (!ponto) return null
  const limitar = (v: number, lado: number) => Math.min(Math.max(v, margem), Math.max(margem, lado - margem))
  const dentro: Ponto = [limitar(ponto[0], tela.largura), limitar(ponto[1], tela.altura)]
  return { ponto: dentro, fora: dentro[0] !== ponto[0] || dentro[1] !== ponto[1] }
}
