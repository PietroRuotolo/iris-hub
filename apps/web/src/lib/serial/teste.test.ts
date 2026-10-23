import { describe, expect, it } from 'vitest'
import { modoTeste } from './teste'

describe('modoTeste', () => {
  it('liga com ?teste, com ou sem valor e junto com outros parâmetros', () => {
    expect(modoTeste('?teste')).toBe(true)
    expect(modoTeste('?jogador=abc&teste=1')).toBe(true)
  })

  it('desligado sem ?teste e fora do navegador', () => {
    expect(modoTeste('?jogador=abc')).toBe(false)
    expect(modoTeste('')).toBe(false)
    expect(modoTeste(null)).toBe(false)
  })
})
