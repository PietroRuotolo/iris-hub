import type { PartidaRitmoSalva, ResultadoAlvoSalvo, StatusPartidaRitmo } from '@iris/contracts'
import type { RhythmPhase, RhythmSession, RhythmTarget } from '@prisma/client'

type Documento = RhythmSession & { phases: (RhythmPhase & { targets: RhythmTarget[] })[] }

export class RhythmSessionResponseDto implements PartidaRitmoSalva {
  id: string
  playerId: string
  status: StatusPartidaRitmo
  totalScore: number | null
  phasesCompleted: number
  totalHits: number
  totalMisses: number
  totalInsufficientTracking: number
  scoringVersion: string
  startedAt: string
  finishedAt: string | null
  phases: PartidaRitmoSalva['phases']

  // Campo a campo: a resposta tem sempre os mesmos campos, sem nada interno do banco.
  static de(doc: Documento): RhythmSessionResponseDto {
    return Object.assign(new RhythmSessionResponseDto(), {
      id: doc.id,
      playerId: doc.playerId,
      status: doc.status as StatusPartidaRitmo,
      totalScore: doc.totalScore ?? null,
      phasesCompleted: doc.phasesCompleted,
      totalHits: doc.totalHits,
      totalMisses: doc.totalMisses,
      totalInsufficientTracking: doc.totalInsufficientTracking,
      scoringVersion: doc.scoringVersion,
      startedAt: doc.startedAt.toISOString(),
      finishedAt: doc.finishedAt?.toISOString() ?? null,
      phases: [...doc.phases]
        .sort((a, b) => a.phaseNumber - b.phaseNumber)
        .map((f) => ({
          phaseNumber: f.phaseNumber,
          score: f.score ?? null,
          totalTargets: f.totalTargets,
          hits: f.hits,
          misses: f.misses,
          insufficientTracking: f.insufficientTracking,
          trackingCoverage: f.trackingCoverage ?? null,
          targetRadiusCm: f.targetRadiusCm,
          beatIntervalMs: f.beatIntervalMs,
          targets: [...f.targets]
            .sort((a, b) => a.targetNumber - b.targetNumber)
            .map((t) => ({
              targetNumber: t.targetNumber,
              result: t.result as ResultadoAlvoSalvo,
              score: t.score ?? null,
              byMagnet: t.byMagnet,
              targetX: t.targetX,
              targetY: t.targetY,
              latencyMs: t.latencyMs ?? null,
              entryOffsetMs: t.entryOffsetMs ?? null,
              dwellTimeMs: t.dwellTimeMs ?? null,
              averageCenterDistancePx: t.averageCenterDistancePx ?? null,
              targetRadiusPx: t.targetRadiusPx ?? null,
              timeScore: t.timeScore ?? null,
              precisionScore: t.precisionScore ?? null,
              trackingCoverage: t.trackingCoverage ?? null,
            })),
        })),
    })
  }
}
