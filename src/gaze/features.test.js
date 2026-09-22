import { describe, expect, it } from 'vitest'
import { OLHO_DIREITO, OLHO_ESQUERDO, ehPiscada, extrairFeatures } from './features'

// 478 landmarks fictícios: dois olhos de 40px de largura; a íris desloca (dx, dy)
// em larguras de olho. Espelha synthetic_landmarks do teste Python (fase0/tests/test_fase0.py).
function landmarksSinteticos({ irisDx = 0, irisDy = 0, abertura = 0.3, rollGraus = 0 } = {}) {
  const pontos = Array.from({ length: 478 }, () => [0, 0])
  const theta = (rollGraus * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const origem = [300, 200]
  const posicionar = ([lx, ly]) => [origem[0] + cos * lx - sin * ly, origem[1] + sin * lx + cos * ly]

  for (const [[esq, dir, iris, sup, inf], cx] of [
    [OLHO_DIREITO, -60],
    [OLHO_ESQUERDO, 60],
  ]) {
    pontos[esq] = posicionar([cx - 20, 0])
    pontos[dir] = posicionar([cx + 20, 0])
    pontos[iris] = posicionar([cx + irisDx * 40, irisDy * 40])
    pontos[sup] = posicionar([cx, -abertura * 20])
    pontos[inf] = posicionar([cx, abertura * 20])
  }
  return pontos
}

describe('extrairFeatures', () => {
  it('recupera o deslocamento da íris', () => {
    const f = extrairFeatures(landmarksSinteticos({ irisDx: 0.12, irisDy: -0.05 }), 640, 480)
    expect(f.h).toBeCloseTo(0.12, 9)
    expect(f.v).toBeCloseTo(-0.05, 9)
    expect(f.abertura).toBeCloseTo(0.3, 9)
  })

  it('é invariante à rotação (roll) da cabeça', () => {
    const a = extrairFeatures(landmarksSinteticos({ irisDx: 0.1, irisDy: 0.05 }), 640, 480)
    const b = extrairFeatures(landmarksSinteticos({ irisDx: 0.1, irisDy: 0.05, rollGraus: 15 }), 640, 480)
    expect(b.h).toBeCloseTo(a.h, 9)
    expect(b.v).toBeCloseTo(a.v, 9)
  })
})

describe('ehPiscada', () => {
  it('detecta olho aberto vs. fechado', () => {
    const aberto = extrairFeatures(landmarksSinteticos({ abertura: 0.3 }), 640, 480)
    const fechado = extrairFeatures(landmarksSinteticos({ abertura: 0.05 }), 640, 480)
    expect(ehPiscada(aberto)).toBe(false)
    expect(ehPiscada(fechado)).toBe(true)
  })
})
