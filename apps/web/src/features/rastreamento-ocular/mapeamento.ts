// Mapeamento olhar → tela: regressão com ridge. Entram a posição da íris no olho (h, v, grau 2), a
// abertura das pálpebras (ajuda no eixo vertical) e a cabeça: rotação, posição na imagem e distância
// (também multiplicando h e v, porque de mais longe o mesmo movimento do olho cobre mais tela).
// Ajustado com as amostras da calibração (features do olhar + posição conhecida do alvo em px).

import type { FeaturesOlhar, Ponto } from './features'
import { desvioPadrao, media, multiplicar, resolverSistema, somarNaDiagonal, transposta, type Matriz } from './linalg'

/** Distância de referência (cm) para escalar os termos de distância. */
const DISTANCIA_REFERENCIA_CM = 60

function linhaDesign({ h, v, abertura, pose }: FeaturesOlhar): number[] {
  const k = pose.distanciaCm / DISTANCIA_REFERENCIA_CM
  return [h, v, h * h, v * v, h * v, abertura, pose.yawGraus, pose.pitchGraus, pose.centroX, pose.centroY, k, h * k, v * k]
}

/**
 * Desvio mínimo de cada coluna ao padronizar. Na calibração a cabeça quase não se mexe: sem esse
 * piso, uma coluna quase constante (ex.: yaw variando 0,3°) seria esticada e viraria ruído. Com o
 * piso, a cabeça só ganha peso no modelo quando os dados mostram a cabeça em posições diferentes.
 */
const DESVIO_MINIMO = [1e-3, 1e-3, 1e-5, 1e-5, 1e-5, 0.01, 3, 3, 0.03, 0.03, 0.05, 1e-3, 1e-3]

function padronizar(matriz: Matriz, medias: number[], desvios: number[]): Matriz {
  return matriz.map((linha) => linha.map((v, j) => (v - medias[j]) / desvios[j]))
}

export class MapeamentoOlhar {
  constructor(
    private readonly pesos: Matriz,
    private readonly medias: number[],
    private readonly desvios: number[],
    private readonly mediaAlvo: Ponto,
    /** Correção somada a toda estimativa (desvio medido na conferência). */
    private readonly correcao: Ponto = [0, 0],
  ) {}

  /** O mesmo mapeamento, com mais uma correção de deslocamento (px). */
  comCorrecao([dx, dy]: Ponto): MapeamentoOlhar {
    return new MapeamentoOlhar(this.pesos, this.medias, this.desvios, this.mediaAlvo, [this.correcao[0] + dx, this.correcao[1] + dy])
  }

  /** Posição estimada do olhar na tela, em px. */
  prever(features: FeaturesOlhar): Ponto {
    return this.preverVarios([features])[0]
  }

  preverVarios(features: FeaturesOlhar[]): Ponto[] {
    const z = padronizar(features.map(linhaDesign), this.medias, this.desvios)
    return multiplicar(z, this.pesos).map(([x, y]) => [x + this.mediaAlvo[0] + this.correcao[0], y + this.mediaAlvo[1] + this.correcao[1]])
  }
}

export function ajustarMapeamento(features: FeaturesOlhar[], alvosPx: Ponto[], ridge = 1e-2): MapeamentoOlhar {
  const design = features.map(linhaDesign)
  const colunas = transposta(design)
  const medias = colunas.map(media)
  const desvios = colunas.map((c, j) => Math.max(desvioPadrao(c), DESVIO_MINIMO[j]))
  const z = padronizar(design, medias, desvios)

  const mediaAlvo: Ponto = [media(alvosPx.map((p) => p[0])), media(alvosPx.map((p) => p[1]))]
  const yCentrado = alvosPx.map((p) => [p[0] - mediaAlvo[0], p[1] - mediaAlvo[1]])

  const zt = transposta(z)
  const pesos = resolverSistema(somarNaDiagonal(multiplicar(zt, z), ridge * z.length), multiplicar(zt, yCentrado))
  return new MapeamentoOlhar(pesos, medias, desvios, mediaAlvo)
}

export function erroPixel(a: Ponto, b: Ponto): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/**
 * Suaviza o olhar entre frames com o filtro One Euro: com o olho parado a bolinha fica firme (filtra
 * forte); quando o olho se move rápido, o filtro afrouxa e a bolinha acompanha sem atraso.
 * t em ms. Sem leitura válida, recomeça do zero.
 */
export function criarSuavizador({ corteMinimoHz = 1, beta = 0.007, corteDerivadaHz = 1 } = {}) {
  const alfa = (corteHz: number, dt: number) => 1 / (1 + 1 / (2 * Math.PI * corteHz * dt))
  let anterior: { t: number; p: Ponto; d: Ponto } | null = null
  return (ponto: Ponto | null, t: number): Ponto | null => {
    if (!ponto) return (anterior = null)
    if (!anterior || t <= anterior.t) {
      anterior = { t, p: ponto, d: [0, 0] }
      return ponto
    }
    const dt = (t - anterior.t) / 1000
    const aD = alfa(corteDerivadaHz, dt)
    const d: Ponto = [
      anterior.d[0] + aD * ((ponto[0] - anterior.p[0]) / dt - anterior.d[0]),
      anterior.d[1] + aD * ((ponto[1] - anterior.p[1]) / dt - anterior.d[1]),
    ]
    const a = alfa(corteMinimoHz + beta * Math.hypot(d[0], d[1]), dt)
    const p: Ponto = [anterior.p[0] + a * (ponto[0] - anterior.p[0]), anterior.p[1] + a * (ponto[1] - anterior.p[1])]
    anterior = { t, p, d }
    return p
  }
}
