import { describe, expect, it } from 'vitest'
import {
  CONTORNO_IRIS_DIREITA,
  CONTORNO_IRIS_ESQUERDA,
  OLHO_DIREITO,
  OLHO_ESQUERDO,
  QUEIXO,
  TESTA,
  distanciaPelaIris,
  ehPiscada,
  extrairFeatures,
  type Ponto3,
} from './features'

// Rosto sintético em 3D (px): olhos de 40 px de largura, íris de raio 10 px, deslocada (dx, dy) em
// larguras de olho; a cabeça pode girar (yaw), inclinar (pitch) e rolar (roll) em torno do meio dos olhos.
function rostoSintetico({ irisDx = 0, irisDy = 0, abertura = 0.3, yaw = 0, pitch = 0, roll = 0, raioIris = 10 } = {}): Ponto3[] {
  const p: Ponto3[] = Array.from({ length: 478 }, () => [0, 0, 0])
  const r = (g: number) => (g * Math.PI) / 180
  const girar = ([x, y, z]: Ponto3): Ponto3 => {
    // roll (em z), pitch (em x), yaw (em y); y da imagem cresce para baixo, z cresce para longe.
    let [a, b, c] = [x * Math.cos(r(roll)) - y * Math.sin(r(roll)), x * Math.sin(r(roll)) + y * Math.cos(r(roll)), z]
    ;[b, c] = [b * Math.cos(r(pitch)) + c * Math.sin(r(pitch)), -b * Math.sin(r(pitch)) + c * Math.cos(r(pitch))]
    ;[a, c] = [a * Math.cos(r(yaw)) - c * Math.sin(r(yaw)), a * Math.sin(r(yaw)) + c * Math.cos(r(yaw))]
    return [640 + a, 360 + b, c]
  }
  const colocar = (i: number, x: number, y: number, z = 0) => (p[i] = girar([x, y, z]))
  for (const [[esq, dir, iris, sup, inf], cx, contorno] of [
    [OLHO_DIREITO, -60, CONTORNO_IRIS_DIREITA],
    [OLHO_ESQUERDO, 60, CONTORNO_IRIS_ESQUERDA],
  ] as const) {
    colocar(esq, cx - 20, 0)
    colocar(dir, cx + 20, 0)
    const ix = cx + irisDx * 40
    const iy = irisDy * 40
    colocar(iris, ix, iy)
    colocar(contorno[0], ix + raioIris, iy)
    colocar(contorno[1], ix, iy - raioIris)
    colocar(contorno[2], ix - raioIris, iy)
    colocar(contorno[3], ix, iy + raioIris)
    colocar(sup, cx, -abertura * 20)
    colocar(inf, cx, abertura * 20)
  }
  colocar(TESTA, 0, -80)
  colocar(QUEIXO, 0, 160)
  return p
}

describe('extrairFeatures', () => {
  it('recupera o deslocamento da íris e a abertura', () => {
    const f = extrairFeatures(rostoSintetico({ irisDx: 0.12, irisDy: -0.05 }), 1280, 720)
    expect(f.h).toBeCloseTo(0.12, 6)
    expect(f.v).toBeCloseTo(-0.05, 6)
    expect(f.abertura).toBeCloseTo(0.3, 6)
  })

  it('a leitura do olho não muda quando a cabeça gira, inclina ou rola', () => {
    const base = extrairFeatures(rostoSintetico({ irisDx: 0.1, irisDy: 0.05 }), 1280, 720)
    for (const giro of [{ yaw: 20 }, { pitch: -15 }, { roll: 12 }, { yaw: 10, pitch: 10, roll: -8 }]) {
      const f = extrairFeatures(rostoSintetico({ irisDx: 0.1, irisDy: 0.05, ...giro }), 1280, 720)
      expect(f.h).toBeCloseTo(base.h, 6)
      expect(f.v).toBeCloseTo(base.v, 6)
    }
  })

  it('mede a rotação da cabeça em graus', () => {
    const pose = (g: object) => extrairFeatures(rostoSintetico(g), 1280, 720).pose
    expect(pose({}).yawGraus).toBeCloseTo(0, 6)
    expect(Math.abs(pose({ yaw: 20 }).yawGraus)).toBeCloseTo(20, 4)
    expect(Math.abs(pose({ pitch: 15 }).pitchGraus)).toBeCloseTo(15, 4)
    expect(Math.abs(pose({ roll: 10 }).rollGraus)).toBeCloseTo(10, 4)
    expect(Math.sign(pose({ yaw: 20 }).yawGraus)).toBe(-Math.sign(pose({ yaw: -20 }).yawGraus))
  })

  it('a distância cresce quando a íris fica menor na imagem', () => {
    const perto = extrairFeatures(rostoSintetico({ raioIris: 16 }), 1280, 720).pose.distanciaCm
    const longe = extrairFeatures(rostoSintetico({ raioIris: 8 }), 1280, 720).pose.distanciaCm
    expect(longe).toBeCloseTo(perto * 2, 6)
    // webcam 1280x720, 76° na diagonal: íris de 24 px ≈ 46 cm
    expect(distanciaPelaIris(24, 1280, 720)).toBeCloseTo(45.9, 0)
    // a mesma câmera em pé (celular) dá a mesma distância
    expect(distanciaPelaIris(24, 720, 1280)).toBeCloseTo(distanciaPelaIris(24, 1280, 720), 9)
  })

  it('detecta piscada', () => {
    expect(ehPiscada(extrairFeatures(rostoSintetico({ abertura: 0.3 }), 1280, 720))).toBe(false)
    expect(ehPiscada(extrairFeatures(rostoSintetico({ abertura: 0.05 }), 1280, 720))).toBe(true)
  })
})
