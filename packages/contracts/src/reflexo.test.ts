import { describe, expect, it } from 'vitest'
import { avaliarRodada, pontuarRodada, resumirReflexo, type RodadaReflexo } from './reflexo'

describe('avaliarRodada', () => {
  it('mandou apertar: apertar a tempo é acerto; o tempo acabar é atrasado', () => {
    expect(avaliarRodada('apertar', 320, 1500)).toEqual({ resultado: 'acerto', tempoReacaoMs: 320 })
    expect(avaliarRodada('apertar', null, 1500)).toEqual({ resultado: 'atrasado', tempoReacaoMs: null })
    expect(avaliarRodada('apertar', 1600, 1500).resultado).toBe('atrasado')
  })

  it('mandou não apertar: segurar é certo; apertar é erro', () => {
    expect(avaliarRodada('nao_apertar', null, 1500)).toEqual({ resultado: 'segurou', tempoReacaoMs: null })
    expect(avaliarRodada('nao_apertar', 400, 1500)).toEqual({ resultado: 'apertou_errado', tempoReacaoMs: 400 })
  })

  it('apertar antes da ordem ou rápido demais (< 100 ms) é antecipação, nas duas ordens', () => {
    expect(avaliarRodada('apertar', -200, 1500)).toEqual({ resultado: 'antecipacao', tempoReacaoMs: null })
    expect(avaliarRodada('apertar', 60, 1500)).toEqual({ resultado: 'antecipacao', tempoReacaoMs: 60 })
    expect(avaliarRodada('nao_apertar', -50, 1500).resultado).toBe('antecipacao')
  })
})

describe('pontuarRodada', () => {
  it('segurar vale 100; o acerto vale de 60 a 100 pela rapidez; erros valem 0', () => {
    expect(pontuarRodada({ resultado: 'segurou', tempoReacaoMs: null, janelaMs: 1500 })).toBe(100)
    expect(pontuarRodada({ resultado: 'acerto', tempoReacaoMs: 150, janelaMs: 1500 })).toBe(100)
    expect(pontuarRodada({ resultado: 'acerto', tempoReacaoMs: 1500, janelaMs: 1500 })).toBe(60)
    expect(pontuarRodada({ resultado: 'acerto', tempoReacaoMs: 825, janelaMs: 1500 })).toBe(80)
    for (const resultado of ['atrasado', 'apertou_errado', 'antecipacao'] as const) {
      expect(pontuarRodada({ resultado, tempoReacaoMs: 300, janelaMs: 1500 })).toBe(0)
    }
  })
})

const rodada = (resultado: RodadaReflexo['resultado'], tempoReacaoMs: number | null = null): Pick<RodadaReflexo, 'resultado' | 'tempoReacaoMs' | 'janelaMs'> => ({
  resultado,
  tempoReacaoMs,
  janelaMs: 1500,
})

describe('resumirReflexo', () => {
  it('conta cada resultado, soma os pontos e tira o tempo só dos acertos', () => {
    const r = resumirReflexo([rodada('acerto', 300), rodada('acerto', 500), rodada('segurou'), rodada('apertou_errado', 250), rodada('atrasado')])
    expect(r).toMatchObject({ rodadas: 5, acertos: 2, segurou: 1, apertouErrado: 1, atrasados: 1, antecipacoes: 0, precisao: 0.6 })
    expect(r).toMatchObject({ tempoMedioMs: 400, melhorTempoMs: 300, desvioPadraoMs: 100 })
    expect(r.pontos).toBe(pontuarRodada(rodada('acerto', 300)) + pontuarRodada(rodada('acerto', 500)) + 100)
  })

  it('sem rodadas ou sem acertos, os tempos ficam vazios (e não zero)', () => {
    expect(resumirReflexo([])).toMatchObject({ precisao: null, tempoMedioMs: null, pontos: 0 })
    expect(resumirReflexo([rodada('segurou')])).toMatchObject({ precisao: 1, tempoMedioMs: null, desvioPadraoMs: null, pontos: 100 })
  })
})