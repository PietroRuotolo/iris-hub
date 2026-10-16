import { describe, expect, it } from 'vitest'
import { urlComJogador, urlSemJogador } from './url'

describe('jogador na URL', () => {
  it('põe e tira o jogador, mantendo os outros parâmetros', () => {
    expect(urlComJogador('/partida', 'ana')).toBe('/partida?jogador=ana')
    expect(urlComJogador('/sessao/1/resumo?jogo=cores', 'ana')).toBe('/sessao/1/resumo?jogo=cores&jogador=ana')
    expect(urlComJogador('/partida?jogador=bia', 'ana')).toBe('/partida?jogador=ana')
    expect(urlSemJogador('/sessao/1/resumo?jogo=cores&jogador=ana')).toBe('/sessao/1/resumo?jogo=cores')
    expect(urlSemJogador('/partida?jogador=ana')).toBe('/partida')
  })
})
