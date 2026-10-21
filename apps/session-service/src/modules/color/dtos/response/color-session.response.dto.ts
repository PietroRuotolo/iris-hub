import type { ColorRound, ColorSession } from '@prisma/client'

type Documento = ColorSession & { rounds: ColorRound[] }

/** A partida como ficou gravada, com as fases em ordem. Campo a campo: nada interno do banco. */
export class ColorSessionResponseDto {
  id: string
  playerId: string
  status: string
  inputSource: string | null
  score: number
  roundsCompleted: number
  totalErrors: number
  timeouts: number
  maxSequenceLength: number
  averageMsPerColor: number | null
  scoringVersion: string
  startedAt: string
  finishedAt: string | null
  rounds: {
    roundNumber: number
    sequenceLength: number
    expectedSequence: number[]
    playerSequence: number[]
    responseTimeMs: number | null
    result: string
    score: number
  }[]

  static de(doc: Documento): ColorSessionResponseDto {
    return Object.assign(new ColorSessionResponseDto(), {
      id: doc.id,
      playerId: doc.playerId,
      status: doc.status,
      inputSource: doc.inputSource ?? null,
      score: doc.score,
      roundsCompleted: doc.roundsCompleted,
      totalErrors: doc.totalErrors,
      timeouts: doc.timeouts,
      maxSequenceLength: doc.maxSequenceLength,
      averageMsPerColor: doc.averageMsPerColor ?? null,
      scoringVersion: doc.scoringVersion,
      startedAt: doc.startedAt.toISOString(),
      finishedAt: doc.finishedAt?.toISOString() ?? null,
      rounds: [...doc.rounds]
        .sort((a, b) => a.roundNumber - b.roundNumber)
        .map((r) => ({
          roundNumber: r.roundNumber,
          sequenceLength: r.sequenceLength,
          expectedSequence: r.expectedSequence,
          playerSequence: r.playerSequence,
          responseTimeMs: r.responseTimeMs ?? null,
          result: r.result,
          score: r.score,
        })),
    })
  }
}