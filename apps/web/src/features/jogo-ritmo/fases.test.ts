import { describe, expect, it } from 'vitest'
import { FASES, RAIO_MIN_PX, raioEmPx } from './fases'

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

describe('FASES', () => {
  it('são as cinco fases, na ordem', () => {
    expect(FASES.map((f) => f.fase)).toEqual([1, 2, 3, 4, 5])
    expect(FASES.map((f) => f.nome)).toEqual(['Familiarização', 'Ritmo constante', 'Alternância', 'Precisão e velocidade', 'Desafio final'])
  })

  it.each(FASES)('fase $fase gera alvos válidos, em ordem de batida', (config) => {
    const alvos = config.gerar(rng(config.fase))
    expect(alvos.length).toBeGreaterThanOrEqual(8)
    alvos.forEach((a, i) => {
      expect(a.numero).toBe(i + 1)
      expect(a.x).toBeGreaterThanOrEqual(0)
      expect(a.x).toBeLessThanOrEqual(1)
      expect(a.y).toBeGreaterThanOrEqual(0)
      expect(a.y).toBeLessThanOrEqual(1)
      expect(a.batidaMs - a.antecedenciaMs).toBeGreaterThan(0)
      if (i > 0) expect(a.batidaMs).toBeGreaterThan(alvos[i - 1].batidaMs)
    })
  })

  it('a fase 4 fica mais difícil: alvos menores e batidas mais próximas', () => {
    const alvos = FASES[3].gerar(rng(7))
    expect(alvos.at(-1)!.raioCm).toBeLessThan(alvos[0].raioCm)
    const intervalo = (i: number) => alvos[i].batidaMs - alvos[i - 1].batidaMs
    expect(intervalo(alvos.length - 1)).toBeLessThan(intervalo(1))
  })
})

describe('raioEmPx', () => {
  const area = { largura: 1600, altura: 800 }
  it('converte cm pela escala da tela', () => {
    expect(raioEmPx(3, 36, null, area)).toBe(108)
  })
  it('não fica menor que o erro da calibração nem que o mínimo', () => {
    expect(raioEmPx(1, 36, 100, area)).toBe(80)
    expect(raioEmPx(0.5, 36, null, area)).toBe(RAIO_MIN_PX)
  })
  it('não passa de 16% da área', () => {
    expect(raioEmPx(10, 36, null, area)).toBe(128)
  })
})
