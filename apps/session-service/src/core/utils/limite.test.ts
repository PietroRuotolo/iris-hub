import { describe, expect, it } from 'vitest'
import { LIMITE_MAXIMO, LIMITE_PADRAO, normalizarLimite } from './limite'

describe('normalizarLimite', () => {
  it('sem pedido, usa o padrão', () => {
    expect(normalizarLimite()).toBe(LIMITE_PADRAO)
  })
  it('valores inválidos caem no padrão', () => {
    expect(normalizarLimite(Number.NaN)).toBe(LIMITE_PADRAO)
    expect(normalizarLimite(0)).toBe(LIMITE_PADRAO)
    expect(normalizarLimite(Number.POSITIVE_INFINITY)).toBe(LIMITE_PADRAO)
  })
  it('respeita o pedido dentro dos limites', () => {
    expect(normalizarLimite(5)).toBe(5)
    expect(normalizarLimite(7.9)).toBe(7)
  })
  it('não passa do máximo e não aceita negativo', () => {
    expect(normalizarLimite(100000)).toBe(LIMITE_MAXIMO)
    expect(normalizarLimite(-3)).toBe(1)
  })
})
