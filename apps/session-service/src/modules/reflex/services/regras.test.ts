import { describe, expect, it } from 'vitest'
import { type FaseRecebida, montarPartida, problemasDaPartida } from './regras'

const fase = (n: number, extra: Partial<FaseRecebida> = {}): FaseRecebida => ({
  attemptNumber: n,
  command: 'press',
  waitTimeMs: 2000,
  windowMs: 1500,
  pressedAfterMs: 825, // 80 pontos
  ...extra,
})
const partida = (fases: FaseRecebida[], status: 'completed' | 'abandoned' = fases.length === 5 ? 'completed' : 'abandoned') => ({
  id: '0192f0a0-0000-7000-8000-000000000001',
  playerId: 'ana',
  status,
  inputSource: 'MOUSE_CLICK' as const,
  startedAt: '2026-10-19T12:00:00.000Z',
  attempts: fases,
})

describe('problemasDaPartida', () => {
  it('aceita uma partida completa e uma interrompida', () => {
    expect(problemasDaPartida(partida([1, 2, 3, 4, 5].map((n) => fase(n))))).toEqual([])
    expect(problemasDaPartida(partida([fase(1), fase(2)]))).toEqual([])
  })

  it('completed exige as 5 fases; abandoned, menos de 5', () => {
    expect(problemasDaPartida(partida([fase(1)], 'completed'))).toContain('status: uma partida completed tem as 5 fases')
    expect(problemasDaPartida(partida([1, 2, 3, 4, 5].map((n) => fase(n)), 'abandoned'))).toContain('status: a partida terminou as 5 fases, não foi abandonada')
  })

  it('recusa fases fora de ordem e aperto antes do começo da espera', () => {
    expect(problemasDaPartida(partida([fase(2)]))).toEqual(['attempts.0.attemptNumber: as fases precisam vir em ordem, a partir da 1'])
    expect(problemasDaPartida(partida([fase(1, { pressedAfterMs: -2500 })]))).toEqual(['attempts.0.pressedAfterMs: antes do começo da espera'])
  })
})

describe('montarPartida', () => {
  const agora = new Date('2026-10-19T12:01:00.000Z')

  it('calcula o resultado e os pontos de cada fase a partir do que o site mediu', () => {
    const dados = montarPartida(
      partida([
        fase(1), // apertou a tempo: success, 80
        fase(2, { command: 'hold', pressedAfterMs: null }), // segurou: held, 100
        fase(3, { pressedAfterMs: null }), // não apertou: timeout, 0
        fase(4, { command: 'hold', pressedAfterMs: 400 }), // apertou no "NÃO APERTE!": wrong_press, 0
        fase(5, { pressedAfterMs: -300 }), // apertou na espera: false_start, 0
      ]),
      agora,
    )
    const fases = dados.attempts!.create as { result: string; score: number; reactionTimeMs: number | null }[]
    expect(fases.map((f) => [f.result, f.score, f.reactionTimeMs])).toEqual([
      ['success', 80, 825],
      ['held', 100, null],
      ['timeout', 0, null],
      ['wrong_press', 0, 400],
      ['false_start', 0, null],
    ])
    expect(dados).toMatchObject({
      status: 'completed',
      totalAttempts: 5,
      validAttempts: 2,
      falseStarts: 1,
      wrongPresses: 1,
      timeouts: 1,
      totalScore: 180,
      averageTimeMs: 825,
      bestTimeMs: 825,
      scoringVersion: 'mestre-v1',
      finishedAt: agora,
    })
  })

  it('sem nenhum acerto, os tempos ficam vazios (e não zero)', () => {
    const dados = montarPartida(partida([fase(1, { command: 'hold', pressedAfterMs: null })]), agora)
    expect(dados).toMatchObject({ totalScore: 100, averageTimeMs: null, bestTimeMs: null, standardDeviationMs: null })
  })
})