import { describe, expect, it } from 'vitest'
import { ehTelaCheia, itemAtivo } from './navegacao'

describe('ehTelaCheia', () => {
  it('reconhece as rotas sem menu e suas subrotas', () => {
    expect(ehTelaCheia('/calibracao')).toBe(true)
    expect(ehTelaCheia('/resultado')).toBe(true)
    expect(ehTelaCheia('/calibracao/algo')).toBe(true)
  })

  it('não confunde rotas com prefixo parecido', () => {
    expect(ehTelaCheia('/')).toBe(false)
    expect(ehTelaCheia('/resultados')).toBe(false)
    expect(ehTelaCheia('/sessoes')).toBe(false)
  })
})

describe('itemAtivo', () => {
  it('"/" só fica ativo na página inicial', () => {
    expect(itemAtivo('/', '/')).toBe(true)
    expect(itemAtivo('/', '/jogo')).toBe(false)
  })

  it('rotas com subrotas continuam ativas', () => {
    expect(itemAtivo('/jogo', '/jogo')).toBe(true)
    expect(itemAtivo('/sessoes', '/sessoes')).toBe(true)
    expect(itemAtivo('/sessoes', '/sessoesx')).toBe(false)
  })
})
