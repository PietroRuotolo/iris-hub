import { describe, expect, it } from 'vitest'
import { mascararEmail, regexBuscaPorNome } from './busca'

describe('busca de jogadores', () => {
  const casa = (termo: string, nome: string) => new RegExp(regexBuscaPorNome(termo), 'i').test(nome)

  it('acha sem diferenciar acentos e maiúsculas, em qualquer parte do nome', () => {
    expect(casa('joao', 'João Pedro')).toBe(true)
    expect(casa('JOÃO', 'joao silva')).toBe(true)
    expect(casa('conceicao', 'Maria da Conceição')).toBe(true)
    expect(casa('pedro', 'João Pedro')).toBe(true)
    expect(casa('ana', 'Mariana')).toBe(true)
    expect(casa('bia', 'Ana')).toBe(false)
  })

  it('não deixa caracteres especiais virarem parte da expressão', () => {
    expect(casa('a.b', 'aXb')).toBe(false)
    expect(casa('a.b', 'a.b')).toBe(true)
    expect(() => regexBuscaPorNome('(*[')).not.toThrow()
  })

  it('mascara o e-mail', () => {
    expect(mascararEmail('ana.souza@gmail.com')).toBe('a***@gmail.com')
    expect(mascararEmail('sem-arroba')).toBe('***')
  })
})
