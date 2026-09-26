// Mapeamento olhar -> tela (regressão polinomial de grau 2 em h,v, com ridge) e
// métricas de erro. Porta de fase0/mapping.py (protótipo Python) para o navegador.

import { desvioPadrao, media, multiplicar, resolverSistema, somarEscalarDiagonal, transposta } from './linalg'

function linhaDesign(f, comCabeca) {
  const linha = [f.h, f.v, f.h * f.h, f.v * f.v, f.h * f.v]
  if (comCabeca) linha.push(f.headX, f.headY)
  return linha
}

function estatisticasColunas(matriz) {
  const m = matriz[0].length
  const medias = new Array(m).fill(0)
  const desvios = new Array(m).fill(0)
  for (let j = 0; j < m; j++) {
    const col = matriz.map((linha) => linha[j])
    medias[j] = media(col)
    desvios[j] = desvioPadrao(col) || 1
  }
  return { medias, desvios }
}

function padronizar(matriz, medias, desvios) {
  return matriz.map((linha) => linha.map((v, j) => (v - medias[j]) / desvios[j]))
}

export class MapeamentoOlhar {
  constructor(pesos, medias, desvios, mediaAlvo, comCabeca) {
    this.pesos = pesos
    this.medias = medias
    this.desvios = desvios
    this.mediaAlvo = mediaAlvo
    this.comCabeca = comCabeca
  }

  prever(features) {
    const lista = Array.isArray(features) ? features : [features]
    const design = lista.map((f) => linhaDesign(f, this.comCabeca))
    const z = padronizar(design, this.medias, this.desvios)
    const yz = multiplicar(z, this.pesos)
    return yz.map(([x, y]) => [x + this.mediaAlvo[0], y + this.mediaAlvo[1]])
  }
}

/**
 * Ajusta o mapeamento a partir de features do olhar e dos pixels-alvo correspondentes.
 * @param {Array} features lista de {h,v,headX,headY}
 * @param {Array} alvosPx lista de [x,y] em pixels
 */
export function ajustarMapeamento(features, alvosPx, { comCabeca = false, ridge = 1e-2 } = {}) {
  const design = features.map((f) => linhaDesign(f, comCabeca))
  const { medias, desvios } = estatisticasColunas(design)
  const z = padronizar(design, medias, desvios)

  const mediaAlvo = [media(alvosPx.map((p) => p[0])), media(alvosPx.map((p) => p[1]))]
  const yCentrado = alvosPx.map((p) => [p[0] - mediaAlvo[0], p[1] - mediaAlvo[1]])

  const zt = transposta(z)
  const gram = somarEscalarDiagonal(multiplicar(zt, z), ridge * z.length)
  const ztY = multiplicar(zt, yCentrado)
  const pesos = resolverSistema(gram, ztY)

  return new MapeamentoOlhar(pesos, medias, desvios, mediaAlvo, comCabeca)
}

export function erroPixel(estimativa, alvo) {
  return Math.hypot(estimativa[0] - alvo[0], estimativa[1] - alvo[1])
}

/** Dispersão (RMS) das estimativas em torno da mediana: precisão/ruído, separada da exatidão. */
export function dispersaoPx(pontos) {
  const ordenar = (i) => [...pontos.map((p) => p[i])].sort((a, b) => a - b)
  const mediana = (lista) => {
    const meio = Math.floor(lista.length / 2)
    return lista.length % 2 ? lista[meio] : (lista[meio - 1] + lista[meio]) / 2
  }
  const medX = mediana(ordenar(0))
  const medY = mediana(ordenar(1))
  const quadrados = pontos.map((p) => (p[0] - medX) ** 2 + (p[1] - medY) ** 2)
  return Math.sqrt(media(quadrados))
}

export function pxParaCm(px, larguraTelaPx, larguraTelaCm) {
  return (px * larguraTelaCm) / larguraTelaPx
}

/** Ângulo visual aproximado (válido perto do centro da tela). */
export function pxParaGraus(px, larguraTelaPx, larguraTelaCm, distanciaCm) {
  return (Math.atan(pxParaCm(px, larguraTelaPx, larguraTelaCm) / distanciaCm) * 180) / Math.PI
}
