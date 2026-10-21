import { describe, expect, it } from 'vitest'
import type { FaseCores } from '@iris/contracts'
import { corpoDaPartidaCores } from './cores'

const fase = (numero: number, extra: Partial<FaseCores> = {}): FaseCores => ({
  numero,
  sequencia: [0, 1, 2],
  apertos: [0, 1, 2],
  tempoRespostaMs: 1234.6,
  resultado: 'acerto',
  ...extra,
})

const partida = (fases: FaseCores[]) => ({
  id: '0192f0a0-0000-7000-8000-000000000001',
  concluida: fases.length === 5,
  acionamento: 'KEYBOARD' as const,
  iniciadaEm: '2026-10-21T12:00:00.000Z',
  fases,
})

describe('corpoDaPartidaCores', () => {
  it('manda só o que o site mediu, no formato do serviço', () => {
    expect(corpoDaPartidaCores(partida([fase(1), fase(2, { sequencia: [3, 4, 0, 1], apertos: [], tempoRespostaMs: null, resultado: 'demorou' })]))).toEqual({
      id: '0192f0a0-0000-7000-8000-000000000001',
      status: 'abandoned',
      inputSource: 'KEYBOARD',
      startedAt: '2026-10-21T12:00:00.000Z',
      rounds: [
        { roundNumber: 1, expectedSequence: [0, 1, 2], playerSequence: [0, 1, 2], responseTimeMs: 1235 },
        { roundNumber: 2, expectedSequence: [3, 4, 0, 1], playerSequence: [], responseTimeMs: null },
      ],
    })
  })

  it('a partida com as 5 fases vai como completed', () => {
    expect(corpoDaPartidaCores(partida([1, 2, 3, 4, 5].map((n) => fase(n)))).status).toBe('completed')
  })
})