import { describe, expect, it } from 'vitest'
import type { FeaturesOlhar, PoseCabeca } from './features'
import {
  checklistPosicionamento,
  luminancia,
  poseParada,
  medirLuz,
  medirPonteOculos,
  medirReflexo,
  pareceOculos,
  problemaDeLuz,
  problemasDaLeitura,
  temReflexo,
} from './qualidade'

const L = 64
const A = 40
const iris = { cx: 32, cy: 20, r: 12 }

/** Recorte de olho sintético: pele média, íris escura e, opcionalmente, um reflexo retangular. */
function olho({ reflexo }: { reflexo?: { x: number; y: number; l: number; a: number } } = {}) {
  const lum = new Float32Array(L * A).fill(150)
  for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) if (Math.hypot(x - iris.cx, y - iris.cy) <= iris.r) lum[y * L + x] = 50
  lum[20 * L + 34] = 255 // brilho natural do olho (um pixel)
  if (reflexo) for (let y = reflexo.y; y < reflexo.y + reflexo.a; y++) for (let x = reflexo.x; x < reflexo.x + reflexo.l; x++) lum[y * L + x] = 250
  return lum
}

describe('reflexo', () => {
  it('o brilho natural do olho não é reflexo', () => {
    expect(temReflexo(medirReflexo(olho(), L, A, iris))).toBe(false)
  })

  it('reflexo de óculos sobre a íris é detectado', () => {
    expect(temReflexo(medirReflexo(olho({ reflexo: { x: 24, y: 12, l: 14, a: 10 } }), L, A, iris))).toBe(true)
  })

  it('reflexo grande perto do olho também', () => {
    expect(temReflexo(medirReflexo(olho({ reflexo: { x: 0, y: 0, l: 20, a: 14 } }), L, A, iris))).toBe(true)
  })
})

describe('luz', () => {
  it('converte RGBA em luminância', () => {
    expect(Array.from(luminancia([255, 255, 255, 255, 0, 0, 0, 255]))).toEqual([255, 0])
  })

  it('aponta pouca luz e contraluz', () => {
    expect(problemaDeLuz(medirLuz([40, 40], [40, 40]))).toBe('poucaLuz')
    expect(problemaDeLuz(medirLuz([90, 90], [180, 180]))).toBe('contraluz')
    expect(problemaDeLuz(medirLuz([140, 140], [150, 150]))).toBeNull()
  })
})

describe('óculos', () => {
  it('pele lisa entre os olhos não parece óculos; a ponte da armação sim', () => {
    const pele = new Float32Array(24 * 12).fill(160)
    const ponte = new Float32Array(24 * 12).fill(160)
    for (let x = 0; x < 24; x++) for (const y of [5, 6]) ponte[y * 24 + x] = 30
    expect(pareceOculos(medirPonteOculos(pele, 24, 12))).toBe(false)
    expect(pareceOculos(medirPonteOculos(ponte, 24, 12))).toBe(true)
  })
})

const pose: PoseCabeca = { distanciaCm: 55, yawGraus: 0, pitchGraus: 0, rollGraus: 0, centroX: 0.5, centroY: 0.45 }
const features: FeaturesOlhar = { h: 0, v: 0, abertura: 0.3, pose }

describe('problemasDaLeitura', () => {
  it('leitura boa não tem problemas', () => {
    expect(problemasDaLeitura(features, false)).toEqual([])
  })

  it('aponta o que invalida a leitura', () => {
    expect(problemasDaLeitura(null, false)).toEqual(['semRosto'])
    expect(problemasDaLeitura({ ...features, abertura: 0.05 }, false)).toContain('piscada')
    expect(problemasDaLeitura(features, true)).toEqual(['reflexo'])
    expect(problemasDaLeitura({ ...features, pose: { ...pose, distanciaCm: 20 } }, false)).toEqual(['perto'])
    expect(problemasDaLeitura({ ...features, pose: { ...pose, yawGraus: 30 } }, false)).toEqual(['virado'])
  })

  it('no celular, 25 cm é uma distância normal', () => {
    const perto = { ...features, pose: { ...pose, distanciaCm: 25 } }
    expect(problemasDaLeitura(perto, false)).toEqual(['perto'])
    expect(problemasDaLeitura(perto, false, { min: 12, max: 70 })).toEqual([])
  })
})

describe('checklistPosicionamento', () => {
  const ok = (itens: ReturnType<typeof checklistPosicionamento>) => itens.every((i) => i.ok)
  const luz = { rosto: 140, quadro: 150 }
  const semReflexo = { esquerdo: false, direito: false }

  it('tudo certo', () => {
    expect(ok(checklistPosicionamento(pose, luz, semReflexo))).toBe(true)
  })

  it('cada problema aparece no seu item', () => {
    const falho = (p: Partial<PoseCabeca>, l = luz, r = semReflexo) =>
      checklistPosicionamento({ ...pose, ...p }, l, r).filter((i) => !i.ok).map((i) => i.id)
    expect(falho({ distanciaCm: 30 })).toEqual(['distancia'])
    expect(falho({ distanciaCm: 90 })).toEqual(['distancia'])
    expect(falho({ centroX: 0.85 })).toEqual(['centro'])
    expect(falho({ yawGraus: 20 })).toEqual(['cabeca'])
    expect(falho({}, { rosto: 30, quadro: 30 })).toEqual(['luz'])
    expect(falho({}, luz, { esquerdo: true, direito: false })).toEqual(['reflexo'])
    expect(checklistPosicionamento(null, null, null)).toEqual([expect.objectContaining({ id: 'rosto', ok: false })])
  })
})

describe('celular no posicionamento', () => {
  const luz = { rosto: 140, quadro: 150 }
  const semReflexo = { esquerdo: false, direito: false }
  const celular = { distanciaCm: { min: 20, max: 45 }, exigeHorizontal: true, exigeApoio: true }
  const falhos = (p: PoseCabeca, extra: object) =>
    checklistPosicionamento(p, luz, semReflexo, { ...celular, ...extra }).filter((i) => !i.ok).map((i) => i.id)

  it('aceita 30 cm, deitado e apoiado', () => {
    expect(falhos({ ...pose, distanciaCm: 30 }, { horizontal: true, apoiado: true })).toEqual([])
  })

  it('pede para deitar e apoiar o celular', () => {
    expect(falhos({ ...pose, distanciaCm: 30 }, { horizontal: false, apoiado: false })).toEqual(['horizontal', 'apoiado'])
  })

  it('reconhece o aparelho parado ou tremendo', () => {
    const parado = Array.from({ length: 20 }, () => pose)
    const tremendo = Array.from({ length: 20 }, (_, i) => ({ ...pose, centroX: 0.5 + (i % 2 ? 0.03 : -0.03) }))
    expect(poseParada(parado)).toBe(true)
    expect(poseParada(tremendo)).toBe(false)
    expect(poseParada(parado.slice(0, 5))).toBeNull()
  })
})
