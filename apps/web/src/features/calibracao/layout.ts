// Layout das telas de tela cheia (calibração e fases do jogo). Título e câmera ficam fixos numa
// faixa no topo; os alvos só aparecem na área abaixo dela, então nunca ficam cobertos. Lógica pura,
// em pixels, testável sem DOM.

export interface Retangulo {
  x: number
  y: number
  largura: number
  altura: number
}

export const MARGEM = 16
/** Raio da área reservada ao alvo da calibração (anel + brilho + folga). */
export const RAIO_ALVO_CALIBRACAO = 80
export const TAMANHO_CAMERA = { largura: 192, altura: 136 } // vídeo 16:9 (108) + faixa inferior (28)
export const TAMANHO_STATUS = { largura: 280, altura: 72 }

const LARGURA_MAX_CABECALHO = 448
const ALTURA_FAIXA = TAMANHO_CAMERA.altura
const FOLGA_AREA = 32 // entre a faixa fixa e o início da área dos alvos
const DISTANCIA_STATUS = RAIO_ALVO_CALIBRACAO + 12

const limitar = (valor: number, minimo: number, maximo: number) => Math.min(Math.max(valor, minimo), maximo)

/** Cabeçalho (centro) e câmera (canto direito) na faixa do topo, e a área onde os alvos aparecem. */
export function calcularLayout({ largura, altura }: { largura: number; altura: number }) {
  const larguraCabecalho = Math.min(LARGURA_MAX_CABECALHO, largura - 2 * (TAMANHO_CAMERA.largura + 2 * MARGEM))
  const topoArea = MARGEM + ALTURA_FAIXA + FOLGA_AREA
  return {
    cabecalho: { x: (largura - larguraCabecalho) / 2, y: MARGEM, largura: larguraCabecalho, altura: ALTURA_FAIXA },
    camera: { x: largura - MARGEM - TAMANHO_CAMERA.largura, y: MARGEM, ...TAMANHO_CAMERA },
    areaAlvos: { x: 0, y: topoArea, largura, altura: altura - topoArea },
  }
}

export type Layout = ReturnType<typeof calcularLayout>

/** Ponto normalizado (0..1) em pixels dentro da área, afastado `margem` px das bordas. */
export function paraPixels(ponto: { x: number; y: number }, area: Retangulo, margem = 0): [number, number] {
  return [
    area.x + margem + ponto.x * (area.largura - 2 * margem),
    area.y + margem + ponto.y * (area.altura - 2 * margem),
  ]
}

/** Cartão de status: logo abaixo do alvo; se não couber, logo acima. Deslocado para dentro nos cantos. */
export function posicionarStatus([x, y]: [number, number], { largura, altura }: { largura: number; altura: number }): Retangulo {
  const abaixo = y + DISTANCIA_STATUS
  const cabeAbaixo = abaixo + TAMANHO_STATUS.altura <= altura - MARGEM
  return {
    x: limitar(x - TAMANHO_STATUS.largura / 2, MARGEM, largura - MARGEM - TAMANHO_STATUS.largura),
    y: cabeAbaixo ? abaixo : y - DISTANCIA_STATUS - TAMANHO_STATUS.altura,
    ...TAMANHO_STATUS,
  }
}
