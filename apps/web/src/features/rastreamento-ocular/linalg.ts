// Álgebra linear mínima para a regressão do mapeamento olhar → tela. Só para matrizes pequenas
// (poucas features); não é uma biblioteca geral.

export type Matriz = number[][]

/** Resolve A·x = b (A quadrada) por eliminação de Gauss-Jordan com pivô parcial. */
export function resolverSistema(a: Matriz, b: Matriz): Matriz {
  const n = a.length
  const colunasB = b[0].length
  const m = a.map((linha, i) => [...linha, ...b[i]])

  for (let col = 0; col < n; col++) {
    let pivo = col
    for (let lin = col + 1; lin < n; lin++) {
      if (Math.abs(m[lin][col]) > Math.abs(m[pivo][col])) pivo = lin
    }
    if (pivo !== col) [m[col], m[pivo]] = [m[pivo], m[col]]

    const valorPivo = m[col][col]
    if (Math.abs(valorPivo) < 1e-12) continue // matriz singular: a linha fica 0
    for (let k = col; k < n + colunasB; k++) m[col][k] /= valorPivo

    for (let lin = 0; lin < n; lin++) {
      if (lin === col) continue
      const fator = m[lin][col]
      if (fator === 0) continue
      for (let k = col; k < n + colunasB; k++) m[lin][k] -= fator * m[col][k]
    }
  }
  return m.map((linha) => linha.slice(n))
}

export function multiplicar(a: Matriz, b: Matriz): Matriz {
  const p = b[0].length
  const resultado = a.map(() => new Array<number>(p).fill(0))
  for (let i = 0; i < a.length; i++) {
    for (let k = 0; k < b.length; k++) {
      const valor = a[i][k]
      if (valor === 0) continue
      for (let j = 0; j < p; j++) resultado[i][j] += valor * b[k][j]
    }
  }
  return resultado
}

export function transposta(a: Matriz): Matriz {
  return a[0].map((_, j) => a.map((linha) => linha[j]))
}

export function somarNaDiagonal(a: Matriz, valor: number): Matriz {
  return a.map((linha, i) => linha.map((v, j) => (i === j ? v + valor : v)))
}

export function media(valores: number[]): number {
  return valores.reduce((soma, v) => soma + v, 0) / valores.length
}

export function desvioPadrao(valores: number[]): number {
  const m = media(valores)
  return Math.sqrt(media(valores.map((v) => (v - m) ** 2)))
}
