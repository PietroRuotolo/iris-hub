import { describe, expect, it } from 'vitest'
import type { FeaturesOlhar, PoseCabeca, Ponto } from './features'
import { ajustarMapeamento, criarSuavizador, erroPixel } from './mapeamento'

function rngDeterministico(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

const POSE: PoseCabeca = { distanciaCm: 60, yawGraus: 0, pitchGraus: 0, rollGraus: 0, centroX: 0.5, centroY: 0.45 }

describe('ajustarMapeamento', () => {
  it('recupera um mapeamento quadrático conhecido', () => {
    const rand = rngDeterministico(42)
    const features: FeaturesOlhar[] = []
    const alvos: Ponto[] = []
    for (let i = 0; i < 500; i++) {
      const h = (rand() - 0.5) * 0.4
      const v = (rand() - 0.5) * 0.2
      features.push({ h, v, abertura: 0.3, pose: POSE })
      alvos.push([960 + 4000 * h + 3000 * h * h, 540 + 6000 * v + 2000 * h * v])
    }
    const modelo = ajustarMapeamento(features, alvos)
    const erros = modelo.preverVarios(features).map((p, i) => erroPixel(p, alvos[i]))
    expect(erros.reduce((a, b) => a + b, 0) / erros.length).toBeLessThan(10)
  })

  it('com a cabeça em posições diferentes nos dados, aprende a compensar a rotação', () => {
    // Tela: x depende do olho (h) e do quanto a cabeça virou (yaw): 1° ≈ 35 px.
    const rand = rngDeterministico(7)
    const gerar = (n: number) =>
      Array.from({ length: n }, () => {
        const h = (rand() - 0.5) * 0.4
        const v = (rand() - 0.5) * 0.2
        const yaw = (rand() - 0.5) * 16
        return { f: { h, v, abertura: 0.3, pose: { ...POSE, yawGraus: yaw } }, alvo: [960 + 4000 * h + 35 * yaw, 540 + 6000 * v] as Ponto }
      })
    const treino = gerar(400)
    const modelo = ajustarMapeamento(treino.map((t) => t.f), treino.map((t) => t.alvo))
    const teste = gerar(100)
    const erros = modelo.preverVarios(teste.map((t) => t.f)).map((p, i) => erroPixel(p, teste[i].alvo))
    expect(erros.reduce((a, b) => a + b, 0) / erros.length).toBeLessThan(15)
  })

  it('com a cabeça parada na calibração, uma leve mexida não bagunça a estimativa', () => {
    const rand = rngDeterministico(3)
    const features: FeaturesOlhar[] = []
    const alvos: Ponto[] = []
    for (let i = 0; i < 300; i++) {
      const h = (rand() - 0.5) * 0.4
      const v = (rand() - 0.5) * 0.2
      // cabeça quase parada: variações mínimas de rotação e posição
      features.push({ h, v, abertura: 0.3, pose: { ...POSE, yawGraus: (rand() - 0.5) * 0.4, centroX: 0.5 + (rand() - 0.5) * 0.004 } })
      alvos.push([960 + 4000 * h, 540 + 6000 * v])
    }
    const modelo = ajustarMapeamento(features, alvos)
    const parado = modelo.prever({ h: 0.05, v: 0, abertura: 0.3, pose: POSE })
    const mexeu = modelo.prever({ h: 0.05, v: 0, abertura: 0.3, pose: { ...POSE, yawGraus: 3, centroX: 0.52 } })
    expect(erroPixel(parado, mexeu)).toBeLessThan(60)
  })
})

describe('criarSuavizador (One Euro)', () => {
  it('com o olho parado, reduz o tremor', () => {
    const suavizar = criarSuavizador()
    const saidas: number[] = []
    for (let i = 0; i < 60; i++) saidas.push(suavizar([500 + (i % 2 ? 20 : -20), 300], i * 33)![0])
    const tremor = Math.max(...saidas.slice(30)) - Math.min(...saidas.slice(30))
    expect(tremor).toBeLessThan(15) // entrada oscila 40 px
  })

  it('num salto do olho, chega perto do destino em poucos frames', () => {
    const suavizar = criarSuavizador()
    for (let i = 0; i < 10; i++) suavizar([100, 100], i * 33)
    let p: [number, number] | null = null
    for (let i = 10; i < 16; i++) p = suavizar([900, 100], i * 33)
    expect(p![0]).toBeGreaterThan(800)
  })

  it('sem leitura recomeça do zero', () => {
    const suavizar = criarSuavizador()
    suavizar([0, 0], 0)
    expect(suavizar(null, 33)).toBeNull()
    expect(suavizar([10, 20], 66)).toEqual([10, 20])
  })
})
