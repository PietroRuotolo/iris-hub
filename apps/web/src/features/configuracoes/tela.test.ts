import { describe, expect, it } from 'vitest'
import { CONFIG_TELA_PADRAO, lerPolegadas, normalizarConfigTela, polegadasDe, pxPorCm } from './tela'

describe('lerPolegadas', () => {
  it('aceita vírgula ou ponto como decimal', () => {
    expect(lerPolegadas('15,6')).toBe(15.6)
    expect(lerPolegadas(' 15.6 ')).toBe(15.6)
    expect(lerPolegadas('24')).toBe(24)
  })

  it('recusa texto, vazio e valores fora do intervalo', () => {
    expect(lerPolegadas('')).toBeNull()
    expect(lerPolegadas('abc')).toBeNull()
    expect(lerPolegadas('15,6"')).toBeNull()
    expect(lerPolegadas('-5')).toBeNull()
    expect(lerPolegadas('2')).toBeNull()
    expect(lerPolegadas('121')).toBeNull()
  })
})

describe('polegadasDe', () => {
  it('usa o tamanho padrão do tipo ou o valor manual', () => {
    expect(polegadasDe(CONFIG_TELA_PADRAO)).toBe(24)
    expect(polegadasDe({ tipo: 'celular', polegadasManual: null })).toBe(6.1)
    expect(polegadasDe({ tipo: 'manual', polegadasManual: 32 })).toBe(32)
    expect(polegadasDe({ tipo: 'manual', polegadasManual: null })).toBeNull()
  })
})

describe('pxPorCm', () => {
  it('converte pela diagonal: 1920×1080 em 24" dá ~36 px/cm', () => {
    expect(pxPorCm(24, 1920, 1080)).toBeCloseTo(36.14, 2)
  })

  it('a mesma resolução numa tela menor tem mais px por cm', () => {
    expect(pxPorCm(13, 1920, 1080)).toBeGreaterThan(pxPorCm(27, 1920, 1080))
  })
})

describe('normalizarConfigTela', () => {
  it('mantém configurações válidas', () => {
    expect(normalizarConfigTela({ tipo: 'tv', polegadasManual: null })).toEqual({ tipo: 'tv', polegadasManual: null })
    expect(normalizarConfigTela({ tipo: 'manual', polegadasManual: 15.6 })).toEqual({ tipo: 'manual', polegadasManual: 15.6 })
  })

  it('volta ao padrão (computador) com valor ausente ou inválido', () => {
    expect(normalizarConfigTela(null)).toEqual(CONFIG_TELA_PADRAO)
    expect(normalizarConfigTela({ tipo: 'geladeira' })).toEqual(CONFIG_TELA_PADRAO)
    expect(normalizarConfigTela({ tipo: 'manual', polegadasManual: 500 })).toEqual(CONFIG_TELA_PADRAO)
    expect(normalizarConfigTela({ tipo: 'manual', polegadasManual: '15' })).toEqual(CONFIG_TELA_PADRAO)
  })
})
