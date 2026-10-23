import { describe, expect, it } from 'vitest'
import { manterNaTela } from './bordas'

const tela = { largura: 1000, altura: 600 }

describe('manterNaTela', () => {
  it('dentro da tela, o ponto não muda', () => {
    expect(manterNaTela([500, 300], tela, 12)).toEqual({ ponto: [500, 300], fora: false })
  })

  it('fora por um lado, encosta na borda (com a margem do raio) e avisa', () => {
    expect(manterNaTela([-80, 300], tela, 12)).toEqual({ ponto: [12, 300], fora: true })
    expect(manterNaTela([1300, 300], tela, 12)).toEqual({ ponto: [988, 300], fora: true })
    expect(manterNaTela([500, -5], tela, 12)).toEqual({ ponto: [500, 12], fora: true })
    expect(manterNaTela([500, 900], tela, 12)).toEqual({ ponto: [500, 588], fora: true })
  })

  it('fora num canto, vai para o canto', () => {
    expect(manterNaTela([-50, 2000], tela, 12)).toEqual({ ponto: [12, 588], fora: true })
  })

  it('na faixa da margem também conta como segurado (a bolinha não sai cortada)', () => {
    expect(manterNaTela([5, 300], tela, 12)).toEqual({ ponto: [12, 300], fora: true })
  })

  it('sem leitura, nada a desenhar', () => {
    expect(manterNaTela(null, tela, 12)).toBeNull()
  })
})
