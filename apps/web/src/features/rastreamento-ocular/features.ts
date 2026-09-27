// Features do olhar e pose da cabeça a partir dos landmarks 3D do MediaPipe Face Landmarker (478
// pontos; íris = 468..477). A posição da íris é medida no referencial da própria cabeça: girar a
// cabeça não muda a leitura do olho, e a rotação e a distância entram separadas no mapeamento.

export type Ponto = [number, number]
/** Ponto 3D em px: x e y da imagem; z na mesma escala de x (negativo = mais perto da câmera). */
export type Ponto3 = [number, number, number]

export interface PoseCabeca {
  /** Distância aproximada dos olhos à câmera, pelo tamanho da íris (cm). */
  distanciaCm: number
  /** Virar para os lados (+ = rosto para a direita da imagem), para cima (+) e inclinar para o ombro. */
  yawGraus: number
  pitchGraus: number
  rollGraus: number
  /** Meio dos olhos na imagem, normalizado 0..1. */
  centroX: number
  centroY: number
}

export interface FeaturesOlhar {
  /** Posição da íris no olho, no referencial da cabeça (unidade = largura do olho), média dos dois olhos. */
  h: number
  v: number
  /** Abertura do olho (distância entre as pálpebras / largura do olho): também muda ao olhar para cima/baixo. */
  abertura: number
  pose: PoseCabeca
}

type IndicesOlho = readonly [canto1: number, canto2: number, iris: number, palpebraSup: number, palpebraInf: number]

// Olho direito do sujeito (lado esquerdo da imagem) e olho esquerdo (lado direito da imagem).
export const OLHO_DIREITO: IndicesOlho = [33, 133, 468, 159, 145]
export const OLHO_ESQUERDO: IndicesOlho = [362, 263, 473, 386, 374]
/** Contorno de cada íris: dois pares de pontos opostos. */
export const CONTORNO_IRIS_DIREITA = [469, 470, 471, 472] as const
export const CONTORNO_IRIS_ESQUERDA = [474, 475, 476, 477] as const
export const TESTA = 10
export const QUEIXO = 152
export const ENTRE_OLHOS = 168

/** Abaixo disso o frame é tratado como piscada. */
export const MIN_ABERTURA = 0.15
/** Diâmetro da íris humana: quase igual em todo mundo (~11,7 mm). */
export const DIAMETRO_IRIS_CM = 1.17
/**
 * Campo de visão diagonal típico de câmera (webcam de notebook ~70–78°, câmera frontal de celular
 * ~75–85°). Pela diagonal, a conta vale com a imagem deitada (computador) ou em pé (celular).
 */
export const FOV_DIAGONAL_GRAUS = 76

const sub3 = (a: Ponto3, b: Ponto3): Ponto3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot3 = (a: Ponto3, b: Ponto3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const esc3 = (a: Ponto3, k: number): Ponto3 => [a[0] * k, a[1] * k, a[2] * k]
const norm3 = (a: Ponto3) => Math.hypot(a[0], a[1], a[2])
const unit3 = (a: Ponto3) => esc3(a, 1 / norm3(a))
const cross3 = (a: Ponto3, b: Ponto3): Ponto3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const meio3 = (a: Ponto3, b: Ponto3): Ponto3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
const graus = (rad: number) => (rad * 180) / Math.PI

/**
 * Eixos da cabeça: x de um canto externo do olho ao outro, y do queixo para a testa, z para a
 * frente do rosto (de frente para a câmera, z = [0, 0, -1]).
 */
export function eixosCabeca(p: Ponto3[]) {
  const origem = meio3(meio3(p[OLHO_DIREITO[0]], p[OLHO_DIREITO[1]]), meio3(p[OLHO_ESQUERDO[0]], p[OLHO_ESQUERDO[1]]))
  const ex = unit3(sub3(p[OLHO_ESQUERDO[1]], p[OLHO_DIREITO[0]]))
  const vertical = sub3(p[TESTA], p[QUEIXO])
  const ey = unit3(sub3(vertical, esc3(ex, dot3(vertical, ex))))
  const ez = cross3(ex, ey)
  return { origem, ex, ey, ez }
}

/** Diâmetro médio das íris na imagem (px), pelos dois pares de pontos opostos de cada contorno. */
export function diametroIrisPx(p: Ponto3[]): number {
  const diametro = ([a, b, c, d]: readonly number[]) =>
    (Math.hypot(p[a][0] - p[c][0], p[a][1] - p[c][1]) + Math.hypot(p[b][0] - p[d][0], p[b][1] - p[d][1])) / 2
  return (diametro(CONTORNO_IRIS_DIREITA) + diametro(CONTORNO_IRIS_ESQUERDA)) / 2
}

export function distanciaPelaIris(diametroPx: number, larguraFrame: number, alturaFrame: number, fovDiagonalGraus = FOV_DIAGONAL_GRAUS): number {
  const focalPx = Math.hypot(larguraFrame, alturaFrame) / (2 * Math.tan(((fovDiagonalGraus / 2) * Math.PI) / 180))
  return (focalPx * DIAMETRO_IRIS_CM) / diametroPx
}

export function extrairPose(p: Ponto3[], larguraFrame: number, alturaFrame: number): PoseCabeca {
  const { origem, ex, ez } = eixosCabeca(p)
  return {
    distanciaCm: distanciaPelaIris(diametroIrisPx(p), larguraFrame, alturaFrame),
    yawGraus: graus(Math.atan2(ez[0], -ez[2])),
    pitchGraus: graus(Math.atan2(-ez[1], Math.hypot(ez[0], ez[2]))),
    rollGraus: graus(Math.atan2(ex[1], ex[0])),
    centroX: origem[0] / larguraFrame,
    centroY: origem[1] / alturaFrame,
  }
}

function featuresDoOlho(local: (i: number) => Ponto, [esq, dir, iris, sup, inf]: IndicesOlho) {
  const a = local(esq)
  const b = local(dir)
  const eixo: Ponto = [b[0] - a[0], b[1] - a[1]]
  const largura = Math.hypot(eixo[0], eixo[1])
  const u: Ponto = [eixo[0] / largura, eixo[1] / largura]
  const n: Ponto = [u[1], -u[0]] // perpendicular; positivo = para baixo (queixo)
  const centro: Ponto = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const pi = local(iris)
  const d: Ponto = [pi[0] - centro[0], pi[1] - centro[1]]
  const ps = local(sup)
  const pn = local(inf)
  return {
    h: (d[0] * u[0] + d[1] * u[1]) / largura,
    v: (d[0] * n[0] + d[1] * n[1]) / largura,
    abertura: Math.hypot(pn[0] - ps[0], pn[1] - ps[1]) / largura,
  }
}

/** Features do olhar e pose da cabeça, com os landmarks em px (z na escala de x). */
export function extrairFeatures(p: Ponto3[], larguraFrame: number, alturaFrame: number): FeaturesOlhar {
  const { origem, ex, ey } = eixosCabeca(p)
  // Coordenadas no plano do rosto: desfaz a rotação da cabeça antes de medir a íris.
  const local = (i: number): Ponto => {
    const d = sub3(p[i], origem)
    return [dot3(d, ex), dot3(d, ey)]
  }
  const dir = featuresDoOlho(local, OLHO_DIREITO)
  const esq = featuresDoOlho(local, OLHO_ESQUERDO)
  return {
    h: (dir.h + esq.h) / 2,
    v: (dir.v + esq.v) / 2,
    abertura: (dir.abertura + esq.abertura) / 2,
    pose: extrairPose(p, larguraFrame, alturaFrame),
  }
}

export function ehPiscada(features: FeaturesOlhar): boolean {
  return features.abertura < MIN_ABERTURA
}
