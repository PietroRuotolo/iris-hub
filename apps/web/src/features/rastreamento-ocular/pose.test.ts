import { describe, expect, it } from 'vitest'
import { desvioDaPose, poseDeReferencia, type Pose } from './pose'

const ref: Pose = { distanciaCm: 55, yawGraus: 0, pitchGraus: 0, rollGraus: 0, centroX: 0.5, centroY: 0.45 }

describe('poseDeReferencia', () => {
  it('usa a mediana e ignora leituras soltas', () => {
    expect(poseDeReferencia([ref, ref, { ...ref, distanciaCm: 90 }]).distanciaCm).toBe(55)
  })
})

describe('desvioDaPose', () => {
  it('movimentos pequenos são tolerados (o mapeamento compensa)', () => {
    expect(desvioDaPose({ ...ref, distanciaCm: 60, yawGraus: 8, centroX: 0.58 }, ref)).toBeNull()
  })

  it('aponta o que corrigir', () => {
    expect(desvioDaPose({ ...ref, distanciaCm: 40 }, ref)).toBe('afastar')
    expect(desvioDaPose({ ...ref, distanciaCm: 70 }, ref)).toBe('aproximar')
    expect(desvioDaPose({ ...ref, yawGraus: 20 }, ref)).toBe('girar')
    expect(desvioDaPose({ ...ref, pitchGraus: -18 }, ref)).toBe('girar')
    expect(desvioDaPose({ ...ref, centroX: 0.7 }, ref)).toBe('centralizar')
  })

  it('com limites maiores (celular), aceita mais movimento', () => {
    const mexeu = { ...ref, yawGraus: 18, centroX: 0.68 }
    expect(desvioDaPose(mexeu, ref)).not.toBeNull()
    expect(desvioDaPose(mexeu, ref, { distancia: 0.3, rotacaoGraus: 22, posicao: 0.22 })).toBeNull()
  })
})
