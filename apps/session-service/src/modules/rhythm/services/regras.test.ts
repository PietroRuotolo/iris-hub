import { describe, expect, it } from 'vitest'
import { type AlvoRecebido, type FaseRecebida, montarPartida, problemasDaPartida } from './regras'

const acerto = (n: number, extra: Partial<AlvoRecebido> = {}): AlvoRecebido => ({
  targetNumber: n,
  result: 'hit',
  byMagnet: false,
  targetX: 0.5,
  targetY: 0.5,
  targetRadiusPx: 80,
  windowMs: 500,
  trackingCoverage: 1,
  entryOffsetMs: -250, // nota de tempo 0,5
  latencyMs: 900,
  dwellTimeMs: 400,
  averageCenterDistancePx: 20, // nota de precisão 0,75
  ...extra,
})
const semResposta = (n: number): AlvoRecebido => ({ targetNumber: n, result: 'no_response', byMagnet: false, targetX: 0.2, targetY: 0.8, targetRadiusPx: 80, windowMs: 500, trackingCoverage: 0.9 })
const semLeitura = (n: number): AlvoRecebido => ({ ...semResposta(n), result: 'insufficient_tracking', trackingCoverage: 0.1 })

const fase = (n: number, alvos: AlvoRecebido[]): FaseRecebida => ({
  phaseNumber: n,
  targetRadiusCm: 3,
  beatIntervalMs: 1600,
  startedAt: `2026-10-18T12:0${n}:00.000Z`,
  finishedAt: `2026-10-18T12:0${n}:30.000Z`,
  targets: alvos,
})
const partida = (fases: FaseRecebida[], status: 'completed' | 'abandoned' = 'abandoned') => ({
  id: '0192f0a0-0000-7000-8000-000000000001',
  playerId: 'ana',
  status,
  startedAt: '2026-10-18T12:00:00.000Z',
  phases: fases,
})

describe('problemasDaPartida', () => {
  it('aceita uma partida interrompida com fases e alvos em ordem', () => {
    expect(problemasDaPartida(partida([fase(1, [acerto(1), semResposta(2)]), fase(2, [semLeitura(1)])]))).toEqual([])
  })

  it('exige as 5 fases numa partida completed, e menos numa abandoned', () => {
    const cinco = [1, 2, 3, 4, 5].map((n) => fase(n, [acerto(1)]))
    expect(problemasDaPartida(partida(cinco, 'completed'))).toEqual([])
    expect(problemasDaPartida(partida(cinco.slice(0, 4), 'completed'))).toContain('status: uma partida completed tem as 5 fases')
    expect(problemasDaPartida(partida(cinco, 'abandoned'))).toContain('status: a partida terminou as 5 fases, não foi abandonada')
  })

  it('recusa fases ou alvos fora de ordem', () => {
    const problemas = problemasDaPartida(partida([fase(2, [acerto(2)])]))
    expect(problemas).toContain('phases.0.phaseNumber: as fases precisam vir em ordem, a partir da 1')
    expect(problemas).toContain('phases.0.targets.0.targetNumber: os alvos precisam vir em ordem (1, 2, 3...)')
  })

  it('o acerto precisa da entrada dentro da janela; sem acerto, não há entrada nem ímã', () => {
    expect(problemasDaPartida(partida([fase(1, [acerto(1, { entryOffsetMs: null })])]))).toEqual(['phases.0.targets.0.entryOffsetMs: obrigatório no acerto'])
    expect(problemasDaPartida(partida([fase(1, [acerto(1, { entryOffsetMs: 700 })])]))).toEqual(['phases.0.targets.0.entryOffsetMs: fora da janela de acerto'])
    expect(problemasDaPartida(partida([fase(1, [{ ...semResposta(1), byMagnet: true, dwellTimeMs: 100 }])]))).toEqual([
      'phases.0.targets.0.byMagnet: só um acerto pode ser pelo ímã',
      'phases.0.targets.0.dwellTimeMs: só existe no acerto',
    ])
  })
})

describe('montarPartida', () => {
  const agora = new Date('2026-10-18T12:10:00.000Z')

  it('calcula os pontos de cada alvo, de cada fase e o total, como o site', () => {
    const dados = montarPartida(partida([fase(1, [acerto(1), semResposta(2), semLeitura(3)]), fase(2, [acerto(1, { byMagnet: true })])]), agora)
    const [f1, f2] = dados.phases!.create as { score: number | null; hits: number; targets: { create: { score: number | null; timeScore: number | null; precisionScore: number | null; trackingCoverage: number }[] } }[]

    // 50 + 30 × 0,5 + 20 × 0,75 = 80; sem resposta = 0; sem leitura fica de fora (null).
    expect(f1.targets.create.map((t) => t.score)).toEqual([80, 0, null])
    expect(f1.targets.create[0]).toMatchObject({ timeScore: 0.5, precisionScore: 0.75, trackingCoverage: 100 })
    expect(f1.score).toBe(40)
    // Pelo ímã vale metade.
    expect(f2.targets.create[0].score).toBe(40)
    expect(f2.score).toBe(40)
    expect(dados).toMatchObject({ totalScore: 40, phasesCompleted: 2, totalHits: 2, totalMisses: 1, totalInsufficientTracking: 1, scoringVersion: 'v1', finishedAt: agora })
  })

  it('sem nenhum alvo com olhar suficiente, a fase e a partida ficam sem pontuação (não zero)', () => {
    const dados = montarPartida(partida([fase(1, [semLeitura(1), semLeitura(2)])]), agora)
    expect(dados.totalScore).toBeNull()
    expect((dados.phases!.create as { score: number | null }[])[0].score).toBeNull()
  })
})
