import { describe, expect, it } from 'vitest'
import { ehTelaCheia, ITEM_CONFIGURACOES, itemAtivo } from './navegacao'

describe('ehTelaCheia', () => {
  it('reconhece as rotas sem menu e suas subrotas', () => {
    expect(ehTelaCheia('/partida')).toBe(true)
    expect(ehTelaCheia('/partida/algo')).toBe(true)
    expect(ehTelaCheia('/resultado')).toBe(true)
    expect(ehTelaCheia('/introducao')).toBe(true)
  })

  it('não confunde rotas com prefixo parecido', () => {
    expect(ehTelaCheia('/')).toBe(false)
    expect(ehTelaCheia('/partidas')).toBe(false)
    expect(ehTelaCheia('/jogo')).toBe(false)
    expect(ehTelaCheia('/resultados')).toBe(false)
  })
})

describe('itemAtivo', () => {
  it('"/" só fica ativo na página inicial', () => {
    expect(itemAtivo('/', '/')).toBe(true)
    expect(itemAtivo('/', '/jogo')).toBe(false)
  })

  it('rotas com subrotas continuam ativas', () => {
    expect(itemAtivo('/jogo', '/jogo')).toBe(true)
    expect(itemAtivo('/jogo', '/jogo/algo')).toBe(true)
    expect(itemAtivo('/jogo', '/jogos')).toBe(false)
  })

  it('Configurações fica ativo só na própria página', () => {
    expect(itemAtivo(ITEM_CONFIGURACOES.rota, '/configuracoes')).toBe(true)
    expect(itemAtivo(ITEM_CONFIGURACOES.rota, '/')).toBe(false)
    expect(ehTelaCheia('/configuracoes')).toBe(false)
  })
})
