import { describe, expect, it } from 'vitest'
import { ordenarRanking } from './ranking'

describe('ordenarRanking', () => {
  it('ordena do maior para o menor, sem mudar a lista original', () => {
    const linhas = [
      { nome: 'B', pontos: 10 },
      { nome: 'A', pontos: 30 },
      { nome: 'C', pontos: 20 },
    ]
    expect(ordenarRanking(linhas).map((l) => l.nome)).toEqual(['A', 'C', 'B'])
    expect(linhas[0].nome).toBe('B')
  })

  it('empate fica em ordem alfabética', () => {
    expect(ordenarRanking([{ nome: 'Zé', pontos: 5 }, { nome: 'Ana', pontos: 5 }]).map((l) => l.nome)).toEqual(['Ana', 'Zé'])
  })
})
