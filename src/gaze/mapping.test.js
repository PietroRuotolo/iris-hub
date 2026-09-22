import { describe, expect, it } from 'vitest'
import { ajustarMapeamento, dispersaoPx, erroPixel, pxParaCm, pxParaGraus } from './mapping'

// Gerador determinístico simples (mesmo espírito do rng.default_rng(0) do teste Python).
function rngDeterministico(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

describe('ajustarMapeamento', () => {
  it('recupera um mapeamento quadrático conhecido', () => {
    const rand = rngDeterministico(42)
    const n = 500
    const features = []
    const alvos = []
    for (let i = 0; i < n; i++) {
      const h = (rand() - 0.5) * 0.4 // -0.2..0.2
      const v = (rand() - 0.5) * 0.2 // -0.1..0.1
      features.push({ h, v, headX: 0.5, headY: 0.4 })
      alvos.push([960 + 4000 * h + 3000 * h * h, 540 + 6000 * v + 2000 * h * v])
    }
    const modelo = ajustarMapeamento(features, alvos)
    const previstos = modelo.prever(features)
    const erros = previstos.map((p, i) => erroPixel(p, alvos[i]))
    const erroMedio = erros.reduce((a, b) => a + b, 0) / erros.length
    expect(erroMedio).toBeLessThan(10) // px, em ~1600px de faixa; ridge introduz viés pequeno
  })
})

describe('erroPixel / conversões de unidade', () => {
  it('calcula a distância euclidiana', () => {
    expect(erroPixel([3, 4], [0, 0])).toBe(5)
  })

  it('converte px para cm e graus', () => {
    expect(pxParaCm(100, 1920, 34.5)).toBeCloseTo((100 * 34.5) / 1920)
    const graus = pxParaGraus(1920, 1920, 34.5, 60)
    expect(graus).toBeCloseTo((Math.atan(34.5 / 60) * 180) / Math.PI)
  })

  it('dispersão de pontos idênticos é zero', () => {
    expect(dispersaoPx([[0, 0], [0, 0], [0, 0]])).toBe(0)
  })
})
