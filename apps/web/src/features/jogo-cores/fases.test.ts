import { describe, expect, it } from 'vitest'
import { gerarFasesCores, sortearSequencia } from './fases'

/** Um "aleatório" que repete a lista dada, para a partida sair sempre igual. */
const roteiro = (valores: number[]) => {
  let i = 0
  return () => valores[i++ % valores.length]
}

describe('fases das cores', () => {
  it('5 fases, de 3 a 7 cores, cada uma mais rápida e com o tempo proporcional ao tamanho', () => {
    const fases = gerarFasesCores()
    expect(fases.map((f) => f.sequencia.length)).toEqual([3, 4, 5, 6, 7])
    expect(fases.map((f) => f.numero)).toEqual([1, 2, 3, 4, 5])
    expect(fases.map((f) => f.limiteMs)).toEqual([7500, 10000, 12500, 15000, 17500])
    for (let i = 1; i < fases.length; i++) expect(fases[i].passoMs).toBeLessThan(fases[i - 1].passoMs)
  })

  it('só usa as cores 0 a 4 e nunca repete a mesma cor seguida', () => {
    for (let n = 0; n < 50; n++) {
      const seq = sortearSequencia(7)
      expect(seq.every((c) => c >= 0 && c <= 4)).toBe(true)
      for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1])
    }
    // O sorteio dá "azul, azul, cinza": a 2ª vira a cor seguinte (cinza) e a 3ª, que repetiria o cinza, vira amarelo.
    expect(sortearSequencia(3, roteiro([0.9, 0.9, 0.1]))).toEqual([4, 0, 1])
  })
})