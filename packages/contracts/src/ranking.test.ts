import { describe, expect, it } from 'vitest'
import { montarRanking, notaDoJogo } from './ranking'

describe('notaDoJogo', () => {
  it('leva os pontos de cada jogo para 0 a 100', () => {
    expect(notaDoJogo('ritmo', 87.25)).toBe(87.3)
    expect(notaDoJogo('reflexo', 358)).toBe(71.6)
    expect(notaDoJogo('cores', 400)).toBe(80)
    expect(notaDoJogo('cores', 500)).toBe(100)
  })

  it('nunca passa de 0 a 100', () => {
    expect(notaDoJogo('reflexo', 900)).toBe(100)
    expect(notaDoJogo('ritmo', -5)).toBe(0)
  })
})

describe('montarRanking', () => {
  const jogador = (nome: string, ritmo: number | null, reflexo: number | null, cores: number | null) => ({ jogadorId: `id-${nome}`, nome, ritmo, reflexo, cores })

  it('só entra quem jogou os 3; a nota geral é a média das três', () => {
    const ranking = montarRanking([jogador('Ana', 90, 400, 450), jogador('Bia', 80, null, 500), jogador('Caio', 60, 250, 300)])
    expect(ranking).toEqual([
      { posicao: 1, jogadorId: 'id-Ana', nome: 'Ana', ritmo: 90, reflexo: 80, cores: 90, geral: 86.7 },
      { posicao: 2, jogadorId: 'id-Caio', nome: 'Caio', ritmo: 60, reflexo: 50, cores: 60, geral: 56.7 },
    ])
  })

  it('empate na nota geral: mesma posição e ordem alfabética', () => {
    const ranking = montarRanking([jogador('Zé', 70, 350, 350), jogador('Ana', 70, 350, 350), jogador('Lia', 90, 450, 450), jogador('Bia', 10, 50, 50)])
    expect(ranking.map((l) => [l.posicao, l.nome, l.geral])).toEqual([
      [1, 'Lia', 90],
      [2, 'Ana', 70],
      [2, 'Zé', 70],
      [4, 'Bia', 10],
    ])
  })

  it('ninguém com os 3 jogos: ranking vazio', () => {
    expect(montarRanking([jogador('Ana', 90, null, null)])).toEqual([])
  })
})