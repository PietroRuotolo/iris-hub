import { describe, expect, it } from 'vitest'
import { aparelhoDaConfig, classificarAparelho } from './aparelho'

describe('aparelho', () => {
  it('reconhece celular, tablet e computador', () => {
    expect(classificarAparelho({ toque: true, menorLadoPx: 390 })).toBe('celular')
    expect(classificarAparelho({ toque: true, menorLadoPx: 820 })).toBe('tablet')
    expect(classificarAparelho({ toque: false, menorLadoPx: 768 })).toBe('computador')
    expect(classificarAparelho({ toque: true, menorLadoPx: 1440 })).toBe('computador') // tela grande com toque
  })

  it('segue a tela escolhida em Configurações', () => {
    expect(aparelhoDaConfig({ tipo: 'celular', polegadasManual: null })).toBe('celular')
    expect(aparelhoDaConfig({ tipo: 'notebook', polegadasManual: null })).toBe('computador')
    expect(aparelhoDaConfig({ tipo: 'manual', polegadasManual: 6.7 })).toBe('celular')
    expect(aparelhoDaConfig({ tipo: 'manual', polegadasManual: 11 })).toBe('tablet')
  })
})
