import { describe, expect, it } from 'vitest'
import type { RodadaReflexo } from '@iris/contracts'
import { corpoDaPartida } from './reflexo'

const rodada = (numero: number, extra: Partial<RodadaReflexo> = {}): RodadaReflexo => ({
  numero,
  ordem: 'apertar',
  esperaMs: 2000,
  janelaMs: 1500,
  apertouAposMs: 312,
  resultado: 'acerto',
  tempoReacaoMs: 312,
  ...extra,
})

const partida = (rodadas: RodadaReflexo[], concluida = rodadas.length === 5) => ({
  id: '0192f0a0-0000-7000-8000-000000000001',
  concluida,
  acionamento: 'MOUSE_CLICK' as const,
  iniciadaEm: '2026-10-19T12:00:00.000Z',
  rodadas,
})

describe('corpoDaPartida', () => {
  it('manda só o que o site mediu, no formato do serviço', () => {
    expect(corpoDaPartida(partida([rodada(1), rodada(2, { ordem: 'nao_apertar', apertouAposMs: null, resultado: 'segurou', tempoReacaoMs: null })]))).toEqual({
      id: '0192f0a0-0000-7000-8000-000000000001',
      status: 'abandoned',
      inputSource: 'MOUSE_CLICK',
      startedAt: '2026-10-19T12:00:00.000Z',
      attempts: [
        { attemptNumber: 1, command: 'press', waitTimeMs: 2000, windowMs: 1500, pressedAfterMs: 312 },
        { attemptNumber: 2, command: 'hold', waitTimeMs: 2000, windowMs: 1500, pressedAfterMs: null },
      ],
    })
  })

  it('a partida com as 5 fases vai como completed', () => {
    expect(corpoDaPartida(partida([1, 2, 3, 4, 5].map((n) => rodada(n)))).status).toBe('completed')
  })

  it('um aperto antes do começo da espera vira o começo da espera (o serviço recusaria)', () => {
    const [f] = corpoDaPartida(partida([rodada(1, { apertouAposMs: -2003.6, resultado: 'antecipacao', tempoReacaoMs: null })])).attempts
    expect(f.pressedAfterMs).toBe(-2000)
  })
})