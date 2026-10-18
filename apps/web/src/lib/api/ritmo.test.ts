import { describe, expect, it } from 'vitest'
import type { TentativaAlvo } from '@iris/contracts'
import { corpoDaPartida } from './ritmo'

const alvo = (extra: Partial<TentativaAlvo> = {}): Omit<TentativaAlvo, 'fase' | 'pontuacao'> => ({
  numeroAlvo: 1,
  alvoX: 0.5,
  alvoY: 0.25,
  raioPx: 80,
  janelaMs: 500,
  apresentadoEm: '2026-10-18T12:00:00.000Z',
  batidaEm: '2026-10-18T12:00:01.500Z',
  respostaEm: '2026-10-18T12:00:01.300Z',
  resultado: 'ACERTO',
  latenciaMs: 1300.4,
  erroTempoMs: 200,
  erroEspacial: 0.25,
  permanenciaMs: 412.7,
  cobertura: 0.95,
  desvioXPx: 3,
  desvioYPx: -2,
  peloIma: true,
  ...extra,
})

const partida = (alvos: ReturnType<typeof alvo>[], concluida = false) => ({
  id: '0192f0a0-0000-7000-8000-000000000001',
  concluida,
  iniciadaEm: '2026-10-18T11:59:00.000Z',
  fases: [{ fase: 1, raioCm: 3, intervaloMs: 1600, iniciadaEm: '2026-10-18T12:00:00.000Z', concluidaEm: '2026-10-18T12:00:30.000Z', alvos }],
})

describe('corpoDaPartida', () => {
  it('traduz o acerto: entrada com sinal (antes da batida = negativa), distância em px, ímã', () => {
    const corpo = corpoDaPartida(partida([alvo()]))
    expect(corpo).toMatchObject({ id: '0192f0a0-0000-7000-8000-000000000001', status: 'abandoned', startedAt: '2026-10-18T11:59:00.000Z' })
    expect(corpo.phases[0]).toMatchObject({ phaseNumber: 1, targetRadiusCm: 3, beatIntervalMs: 1600 })
    expect(corpo.phases[0].targets[0]).toEqual({
      targetNumber: 1,
      result: 'hit',
      byMagnet: true,
      targetX: 0.5,
      targetY: 0.25,
      targetRadiusPx: 80,
      windowMs: 500,
      trackingCoverage: 0.95,
      latencyMs: 1300,
      entryOffsetMs: -200,
      dwellTimeMs: 413,
      averageCenterDistancePx: 20,
    })
  })

  it('sem acerto, não manda entrada, permanência, distância nem ímã', () => {
    const [t] = corpoDaPartida(
      partida([alvo({ resultado: 'SEM_RESPOSTA', respostaEm: null, latenciaMs: null, erroTempoMs: null, erroEspacial: null, permanenciaMs: null, peloIma: false })], true),
    ).phases[0].targets
    expect(t).toEqual({ targetNumber: 1, result: 'no_response', byMagnet: false, targetX: 0.5, targetY: 0.25, targetRadiusPx: 80, windowMs: 500, trackingCoverage: 0.95 })
  })

  it('partida concluída vai como completed', () => {
    expect(corpoDaPartida(partida([alvo()], true)).status).toBe('completed')
  })
})
