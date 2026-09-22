// Álgebra linear mínima para a Fase 0 (sem dependência externa): resolve sistemas
// lineares pequenos por eliminação de Gauss-Jordan, para a regressão ridge do mapeamento
// olhar -> tela. Serve só para matrizes pequenas (poucas features); não é uma lib geral.

/** Resolve A x = b (A quadrada) por eliminação de Gauss-Jordan com pivô parcial. */
export function resolverSistema(a, b) {
  const n = a.length
  const m = a.map((linha, i) => [...linha, ...b[i]])
  const colunasB = b[0].length

  for (let col = 0; col < n; col++) {
    let pivo = col
    for (let lin = col + 1; lin < n; lin++) {
      if (Math.abs(m[lin][col]) > Math.abs(m[pivo][col])) pivo = lin
    }
    if (pivo !== col) [m[col], m[pivo]] = [m[pivo], m[col]]

    const valorPivo = m[col][col]
    if (Math.abs(valorPivo) < 1e-12) continue // matriz singular: linha ignorada (fica 0)
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

/** Multiplica matriz (n x m) por matriz (m x p). */
export function multiplicar(a, b) {
  const n = a.length
  const m = b.length
  const p = b[0].length
  const resultado = Array.from({ length: n }, () => new Array(p).fill(0))
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < m; k++) {
      const valor = a[i][k]
      if (valor === 0) continue
      for (let j = 0; j < p; j++) resultado[i][j] += valor * b[k][j]
    }
  }
  return resultado
}

export function transposta(a) {
  const n = a.length
  const m = a[0].length
  const t = Array.from({ length: m }, () => new Array(n))
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) t[j][i] = a[i][j]
  return t
}

export function somarEscalarDiagonal(a, escalar) {
  return a.map((linha, i) => linha.map((v, j) => (i === j ? v + escalar : v)))
}

export function media(valores) {
  return valores.reduce((soma, v) => soma + v, 0) / valores.length
}

export function desvioPadrao(valores) {
  const m = media(valores)
  return Math.sqrt(media(valores.map((v) => (v - m) ** 2)))
}
