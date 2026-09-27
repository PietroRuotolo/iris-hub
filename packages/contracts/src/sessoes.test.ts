import { describe, expect, it } from 'vitest'
import { pontuarTentativa, resumirFase, resumirSessao } from './sessoes'

const acerto = { resultado: 'ACERTO' as const, erroTempoMs: 120, janelaMs: 500, erroEspacial: 15 / 50, cobertura: 1 }

describe('pontuarTentativa', () => {
  it('segue o exemplo da regra: 120 ms fora da batida e 15 px num raio de 50 px ≈ 87 pontos', () => {
    // notaTempo 0,76 · notaPrecisao 0,70 → 50 + 22,8 + 14 = 86,8
    expect(pontuarTentativa(acerto)).toBe(86.8)
  })

  it('acerto perfeito vale 100 e o mínimo de um acerto é 50', () => {
    expect(pontuarTentativa({ ...acerto, erroTempoMs: 0, erroEspacial: 0 })).toBe(100)
    expect(pontuarTentativa({ ...acerto, erroTempoMs: 900, erroEspacial: 3 })).toBe(50)
  })

  it('sem acerto vale 0', () => {
    expect(pontuarTentativa({ ...acerto, resultado: 'SEM_RESPOSTA' })).toBe(0)
    expect(pontuarTentativa({ ...acerto, resultado: 'RASTREAMENTO_INSUFICIENTE' })).toBe(0)
  })
})

describe('resumirFase', () => {
  it('conta resultados e tira da média os alvos sem rastreamento', () => {
    const resumo = resumirFase(1, 'Familiarização', [
      { ...acerto, erroTempoMs: 0, erroEspacial: 0 }, // 100
      { ...acerto, resultado: 'SEM_RESPOSTA', cobertura: 0.9 }, // 0
      { ...acerto, resultado: 'RASTREAMENTO_INSUFICIENTE', cobertura: 0.1 }, // fora da média
    ])
    expect(resumo).toMatchObject({ alvosApresentados: 3, acertos: 1, semResposta: 1, rastreamentoInsuficiente: 1, pontuacao: 50 })
    expect(resumo.coberturaRastreamento).toBeCloseTo(0.667, 3)
  })

  it('fase sem alvos válidos fica com 0 pontos', () => {
    expect(resumirFase(2, 'x', [{ ...acerto, resultado: 'RASTREAMENTO_INSUFICIENTE' }]).pontuacao).toBe(0)
  })
})

describe('resumirSessao', () => {
  it('é a média das fases jogadas', () => {
    expect(resumirSessao([
      { pontuacao: 80, coberturaRastreamento: 0.9 },
      { pontuacao: 60, coberturaRastreamento: null },
    ])).toEqual({ pontuacaoTotal: 70, coberturaTotal: 0.9 })
    expect(resumirSessao([])).toEqual({ pontuacaoTotal: null, coberturaTotal: null })
  })
})
