import { describe, expect, it } from 'vitest'
import { formatarNota, iniciais } from './ranking'

describe('ranking: ajudantes da tela', () => {
  it('as iniciais pegam as duas primeiras palavras', () => {
    expect(iniciais('Ana Souza')).toBe('AS')
    expect(iniciais('maria clara dos santos')).toBe('MC')
    expect(iniciais('Zé')).toBe('Z')
  })

  it('a nota sai com vírgula e no máximo uma casa', () => {
    expect(formatarNota(86.7)).toBe('86,7')
    expect(formatarNota(80)).toBe('80')
    expect(formatarNota(100)).toBe('100')
  })
})