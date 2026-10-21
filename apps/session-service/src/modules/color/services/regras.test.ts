import { describe, expect, it } from 'vitest'
import { type FaseRecebida, montarPartida, problemasDaPartida } from './regras'

// As 5 sequências de uma partida (3 a 7 cores).
const SEQ = [
  [0, 1, 2],
  [3, 4, 0, 1],
  [2, 3, 4, 0, 1],
  [1, 2, 3, 4, 0, 1],
  [4, 3, 2, 1, 0, 1, 2],
]
/** Acertou a fase n em 400 ms por cor (100 pontos), a não ser que `extra` diga outra coisa. */
const fase = (n: number, extra: Partial<FaseRecebida> = {}): FaseRecebida => ({
  roundNumber: n,
  expectedSequence: SEQ[n - 1],
  playerSequence: SEQ[n - 1],
  responseTimeMs: SEQ[n - 1].length * 400,
  ...extra,
})
const partida = (fases: FaseRecebida[], status: 'completed' | 'abandoned' = fases.length === 5 ? 'completed' : 'abandoned') => ({
  id: '0192f0a0-0000-7000-8000-000000000001',
  playerId: 'ana',
  status,
  inputSource: 'MOUSE_CLICK' as const,
  startedAt: '2026-10-21T12:00:00.000Z',
  rounds: fases,
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

  it('recusa fase fora de ordem, tamanho errado, apertos depois de um erro e tempo impossível', () => {
    expect(problemasDaPartida(partida([fase(2)]))).toContain('rounds.0.roundNumber: as fases precisam vir em ordem, a partir da 1')
    expect(problemasDaPartida(partida([fase(1, { expectedSequence: [0, 1, 2, 3], playerSequence: [0, 1, 2, 3] })]))).toEqual(['rounds.0.expectedSequence: a fase 1 tem 3 cores'])
    expect(problemasDaPartida(partida([fase(1, { playerSequence: [4, 1, 2] })]))).toEqual(['rounds.0.playerSequence: continua depois de um erro'])
    expect(problemasDaPartida(partida([fase(1, { responseTimeMs: 60_000 })]))).toEqual(['rounds.0.responseTimeMs: passou do tempo da fase'])
    expect(problemasDaPartida(partida([fase(1, { playerSequence: [], responseTimeMs: 900 })]))).toEqual(['rounds.0.responseTimeMs: tem que vir quando houve aperto, e só então'])
  })
})

describe('montarPartida', () => {
  const agora = new Date('2026-10-21T12:01:00.000Z')

  it('calcula o resultado e os pontos de cada fase a partir do que o site mediu', () => {
    const dados = montarPartida(
      partida([
        fase(1), // acertou a 400 ms por cor: success, 100
        fase(2, { responseTimeMs: 4 * 1450 }), // acertou a 1450 ms por cor: success, 80
        fase(3, { playerSequence: [2, 3, 0], responseTimeMs: 1500 }), // a 3ª cor errada: wrong_color, 0
        fase(4, { playerSequence: [1, 2], responseTimeMs: 1000 }), // parou no meio e o tempo acabou: timeout, 0
        fase(5, { playerSequence: [], responseTimeMs: null }), // não apertou nada: timeout, 0
      ]),
      agora,
    )
    const fases = dados.rounds!.create as { result: string; score: number; sequenceLength: number }[]
    expect(fases.map((f) => [f.result, f.score, f.sequenceLength])).toEqual([
      ['success', 100, 3],
      ['success', 80, 4],
      ['wrong_color', 0, 5],
      ['timeout', 0, 6],
      ['timeout', 0, 7],
    ])
    expect(dados).toMatchObject({
      status: 'completed',
      score: 180,
      roundsCompleted: 2,
      totalErrors: 1,
      timeouts: 2,
      maxSequenceLength: 4,
      averageMsPerColor: 925,
      scoringVersion: 'fases-v1',
      finishedAt: agora,
    })
  })

  it('sem nenhum acerto, o ritmo fica vazio (e não zero)', () => {
    const dados = montarPartida(partida([fase(1, { playerSequence: [1], responseTimeMs: 300 })]), agora)
    expect(dados).toMatchObject({ score: 0, roundsCompleted: 0, maxSequenceLength: 0, averageMsPerColor: null })
  })
})