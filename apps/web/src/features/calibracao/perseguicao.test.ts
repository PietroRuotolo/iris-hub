import { describe, expect, it } from 'vitest'
import type { FeaturesOlhar, Ponto } from '@/features/rastreamento-ocular/features'
import { ajustarMapeamento } from '@/features/rastreamento-ocular/mapeamento'
import { PESO_PERSEGUICAO, criarPercurso, estimarAtraso, medidasDoOlhar, rotularPerseguicao, velocidadePxS, type LeituraPerseguicao } from './perseguicao'

const AREA = { x: 0, y: 0, largura: 1920, altura: 1080 }
/** "Olho" sintético: a posição na tela vira h e v (e cada olho igual). */
const olhando = ([x, y]: Ponto, yaw = 0): FeaturesOlhar => {
  const h = (x / 1920 - 0.5) * 0.3
  const v = (y / 1080 - 0.5) * 0.2
  return { h, v, abertura: 0.3, pose: { distanciaCm: 60, yawGraus: yaw, pitchGraus: 0, rollGraus: 0, centroX: 0.5, centroY: 0.45 }, porOlho: { direito: [h, v], esquerdo: [h, v] } }
}
// O modelo dos 9 pontos fixos.
const grade = [0.1, 0.5, 0.9].flatMap((y) => [0.1, 0.5, 0.9].map((x): Ponto => [x * 1920, y * 1080]))
const modelo = ajustarMapeamento(grade.map((p) => olhando(p)), grade)

const VELOCIDADE = 575
const percurso = criarPercurso(AREA, VELOCIDADE)
/** Leituras a 30 fps de quem segue o ponto com `atrasoMs` de atraso. */
const seguir = (atrasoMs: number): LeituraPerseguicao[] =>
  Array.from({ length: Math.floor(percurso.duracaoMs / 33) }, (_, i) => ({ t: i * 33, features: olhando(percurso.posicao(i * 33 - atrasoMs).ponto) }))

describe('percurso', () => {
  it('é contínuo (sem saltos) e cobre bordas e cantos', () => {
    let anterior = percurso.posicao(0).ponto
    const xs: number[] = []
    const ys: number[] = []
    for (let t = 0; t <= percurso.duracaoMs; t += 20) {
      const { ponto } = percurso.posicao(t)
      expect(Math.hypot(ponto[0] - anterior[0], ponto[1] - anterior[1])).toBeLessThan(VELOCIDADE * 0.02 + 1)
      anterior = ponto
      xs.push(ponto[0])
      ys.push(ponto[1])
    }
    expect(Math.min(...xs)).toBeCloseTo(192, 0)
    expect(Math.max(...xs)).toBeCloseTo(1728, 0)
    expect(Math.min(...ys)).toBeCloseTo(108, 0)
    expect(Math.max(...ys)).toBeCloseTo(972, 0)
  })

  it('dura uns 30 s a 15°/s numa tela Full HD', () => {
    expect(percurso.duracaoMs).toBeGreaterThan(25_000)
    expect(percurso.duracaoMs).toBeLessThan(33_000)
  })

  it('a velocidade sai do tamanho da tela e da distância; sem eles, 25% da largura por segundo', () => {
    expect(velocidadePxS({ pxPorCm: 36, distanciaCm: 60, larguraPx: 1920 })).toBeCloseTo(579, 0)
    expect(velocidadePxS({ pxPorCm: null, distanciaCm: null, larguraPx: 1920 })).toBe(480)
  })
})

describe('atraso e rótulos', () => {
  it('estima o atraso do olho', () => {
    expect(estimarAtraso(seguir(120), percurso, modelo)).toBe(120)
    expect(estimarAtraso(seguir(0), percurso, modelo)).toBe(0)
  })

  it('liga cada leitura ao ponto de antes (com o atraso) e usa o peso da perseguição', () => {
    const r = rotularPerseguicao(seguir(120), percurso, modelo, { velocidade: VELOCIDADE, diagonalPx: 2203 })
    expect(r.atrasoMs).toBe(120)
    expect(r.aproveitadas).toBeGreaterThan(400)
    for (const l of r.leituras.slice(0, 50)) {
      const [x, y] = modelo.prever(l.features)
      expect(Math.hypot(x - l.alvoPx[0], y - l.alvoPx[1])).toBeLessThan(5)
      expect(l.peso).toBe(PESO_PERSEGUICAO)
    }
  })

  it('descarta os saltos e as leituras de quem não estava seguindo', () => {
    const leituras = seguir(100)
    // Um salto para longe (a pessoa olhou para outro lado por um instante).
    leituras[300] = { ...leituras[300], features: olhando([1900, 50]) }
    const r = rotularPerseguicao(leituras, percurso, modelo, { velocidade: VELOCIDADE, diagonalPx: 2203 })
    expect(r.leituras.some((l) => l.features === leituras[300].features)).toBe(false)
  })
})

describe('medidas do olhar', () => {
  it('mede o alcance e percebe a cabeça acompanhando', () => {
    const parada = medidasDoOlhar(seguir(0).map((l) => l.features!))
    expect(parada.alcanceH).toBeGreaterThan(0.2)
    expect(parada.assimetria).toBeCloseTo(1)
    expect(parada.cabecaAcompanhou).toBe(false)
    const mexendo = medidasDoOlhar(seguir(0).map((l, i) => ({ ...l.features!, pose: { ...l.features!.pose, yawGraus: (i % 100) / 10 } })))
    expect(mexendo.cabecaAcompanhou).toBe(true)
  })
})
