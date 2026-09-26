import { describe, expect, it } from 'vitest'
import type { EventoJogo } from '@iris/contracts'
import { calcularResumo } from './calcular-resumo.js'

describe('calcularResumo', () => {
  it('conta acertos e erros e calcula tempo e precisão só dos acertos', () => {
    const eventos: EventoJogo[] = [
      { tipo: 'alvo-apresentado', instanteMs: 0 },
      { tipo: 'acerto', instanteMs: 400, tempoRespostaMs: 300, precisaoPx: 20 },
      { tipo: 'acerto', instanteMs: 900, tempoRespostaMs: 500, precisaoPx: 40 },
      { tipo: 'erro', instanteMs: 1500, tempoRespostaMs: 9999, precisaoPx: 999 },
      { tipo: 'piscada', instanteMs: 1600 },
    ]
    expect(calcularResumo(eventos)).toEqual({
      acertos: 2,
      erros: 1,
      taxaAcerto: 2 / 3,
      tempoRespostaMedioMs: 400,
      tempoRespostaDesvioPadraoMs: 100,
      precisaoMediaPx: 30,
      variabilidadeFixacaoPx: 10,
    })
  })

  it('sem acertos nem erros, as médias ficam nulas', () => {
    expect(calcularResumo([{ tipo: 'piscada', instanteMs: 0 }])).toEqual({
      acertos: 0,
      erros: 0,
      taxaAcerto: null,
      tempoRespostaMedioMs: null,
      tempoRespostaDesvioPadraoMs: null,
      precisaoMediaPx: null,
      variabilidadeFixacaoPx: null,
    })
  })
})
