import { describe, expect, it } from 'vitest'
import { calcularLayout, paraPixels } from '@/features/calibracao/layout'
import { FATOR_IMA, raiosDoIma } from '@/features/rastreamento-ocular/ima'
import { FASES, RAIO_MIN_PX, parametrosDaFase, raioEmPx } from './fases'

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

  it('numa tela pequena, respeita o mínimo proporcional à área', () => {
    const celular = { largura: 800, altura: 330 }
    expect(raioEmPx(0.5, 60, null, celular)).toBe(RAIO_MIN_PX)
    expect(raioEmPx(0.5, 60, null, celular, 0.16)).toBe(53)
  })
})

describe('parametrosDaFase', () => {
  it('raio e intervalo constantes na fase 1', () => {
    expect(parametrosDaFase(FASES[0].gerar())).toEqual({ raioCm: 3.5, intervaloMs: 2200 })
  })

  it('na fase 5, que muda alvo a alvo, a mediana', () => {
    const { raioCm, intervaloMs } = parametrosDaFase(FASES[4].gerar(rng(7)))
    expect(raioCm).toBeGreaterThanOrEqual(2)
    expect(raioCm).toBeLessThanOrEqual(2.6)
    expect(intervaloMs).toBeGreaterThanOrEqual(1000)
    expect(intervaloMs).toBeLessThanOrEqual(1400)
  })
})

describe('ímã da Alternância (fase 3)', () => {
  it('só a fase 3 tem ímã próprio, mais forte que o do jogo', () => {
    expect(FASES[2].fatorIma).toBeGreaterThan(FATOR_IMA)
    expect(FASES.filter((f) => f.fase !== 3).every((f) => f.fatorIma === undefined)).toBe(true)
  })

  // Celular, notebook e monitor: tela (px CSS), px por cm, erro da calibração e raio mínimo do aparelho.
  const telas = [
    { largura: 390, altura: 844, pxPorCm: 60, erro: 60, fracao: 0.11 },
    { largura: 1366, altura: 768, pxPorCm: 40, erro: 80, fracao: 0 },
    { largura: 1920, altura: 1080, pxPorCm: 36, erro: 80, fracao: 0 },
  ]

  it.each(telas)('em $largura×$altura, olhando para o próximo alvo, o ímã do anterior já soltou', ({ largura, altura, pxPorCm, erro, fracao }) => {
    const area = calcularLayout({ largura, altura }).areaAlvos
    const alvos = FASES[2].gerar().map((a) => {
      const raio = raioEmPx(a.raioCm, pxPorCm, erro, area, fracao)
      return { raio, centro: paraPixels(a, area, raio + 8) }
    })
    alvos.slice(1).forEach((alvo, i) => {
      const anterior = alvos[i]
      const distancia = Math.hypot(alvo.centro[0] - anterior.centro[0], alvo.centro[1] - anterior.centro[1])
      expect(distancia).toBeGreaterThan(raiosDoIma(anterior.raio, FASES[2].fatorIma).soltura)
    })
  })
})
