// Extração de features do olhar a partir dos landmarks do MediaPipe Face Landmarker
// (478 pontos; íris = 468..477). Porta direta da lógica validada no protótipo Python
// da Fase 0 (fase0/mapping.py) para o navegador.

// Cada olho: (canto esquerdo na imagem, canto direito na imagem, centro da íris, pálpebra sup., pálpebra inf.)
export const OLHO_DIREITO = [33, 133, 468, 159, 145] // olho direito do sujeito (lado esquerdo da imagem)
export const OLHO_ESQUERDO = [362, 263, 473, 386, 374] // olho esquerdo do sujeito (lado direito da imagem)

export const MIN_ABERTURA = 0.15 // abaixo disso o frame é tratado como piscada

function subtrair(a, b) {
  return [a[0] - b[0], a[1] - b[1]]
}
function somar(a, b) {
  return [a[0] + b[0], a[1] + b[1]]
}
function escalar(a, k) {
  return [a[0] * k, a[1] * k]
}
function norma(a) {
  return Math.hypot(a[0], a[1])
}
function produtoInterno(a, b) {
  return a[0] * b[0] + a[1] * b[1]
}

function featuresDoOlho(pontos, [esq, dir, iris, sup, inf]) {
  const a = pontos[esq]
  const b = pontos[dir]
  const p = pontos[iris]
  const eixo = subtrair(b, a)
  const largura = norma(eixo)
  const u = escalar(eixo, 1 / largura)
  const n = [-u[1], u[0]] // perpendicular; aponta "para baixo" na imagem
  const centro = escalar(somar(a, b), 0.5)
  const d = subtrair(p, centro)
  const h = produtoInterno(d, u) / largura
  const v = produtoInterno(d, n) / largura
  const abertura = norma(subtrair(pontos[inf], pontos[sup])) / largura
  return { h, v, abertura }
}

/**
 * Converte landmarks (478 pontos, em pixels da imagem) em features do olhar:
 * { h, v, headX, headY, abertura }.
 *
 * h, v: posição da íris no referencial do olho (origem no centro entre os cantos,
 * eixo x ao longo dos cantos, unidade = largura do olho), média dos dois olhos.
 * Invariante à distância da câmera e à rotação (roll) da cabeça.
 * headX, headY: posição do meio dos olhos na imagem, normalizada (proxy do movimento da cabeça).
 */
export function extrairFeatures(pontos, larguraFrame, alturaFrame) {
  const dir = featuresDoOlho(pontos, OLHO_DIREITO)
  const esq = featuresDoOlho(pontos, OLHO_ESQUERDO)
  const centroDir = escalar(somar(pontos[OLHO_DIREITO[0]], pontos[OLHO_DIREITO[1]]), 0.5)
  const centroEsq = escalar(somar(pontos[OLHO_ESQUERDO[0]], pontos[OLHO_ESQUERDO[1]]), 0.5)
  const meio = escalar(somar(centroDir, centroEsq), 0.5)

  return {
    h: (dir.h + esq.h) / 2,
    v: (dir.v + esq.v) / 2,
    headX: meio[0] / larguraFrame,
    headY: meio[1] / alturaFrame,
    abertura: (dir.abertura + esq.abertura) / 2,
  }
}

export function ehPiscada(features) {
  return features.abertura < MIN_ABERTURA
}
