import type { ReflexAttempt, ReflexSession } from '@prisma/client'

type Documento = ReflexSession & { attempts: ReflexAttempt[] }

/** A partida como ficou gravada, com as fases em ordem. Campo a campo: nada interno do banco. */
export class ReflexSessionResponseDto {
  id: string
  playerId: string
  status: string
  inputSource: string | null
  totalAttempts: number
  validAttempts: number
  falseStarts: number
  wrongPresses: number
  timeouts: number
  totalScore: number
  averageTimeMs: number | null
  bestTimeMs: number | null
  standardDeviationMs: number | null
  scoringVersion: string
  startedAt: string
  finishedAt: string | null
  attempts: {
    attemptNumber: number
    command: string
    waitTimeMs: number | null
    windowMs: number
    pressedAfterMs: number | null
    result: string
    reactionTimeMs: number | null
    score: number
  }[]

  static de(doc: Documento): ReflexSessionResponseDto {
    return Object.assign(new ReflexSessionResponseDto(), {
      id: doc.id,
      playerId: doc.playerId,
      status: doc.status,
      inputSource: doc.inputSource ?? null,
      totalAttempts: doc.totalAttempts,
      validAttempts: doc.validAttempts,
      falseStarts: doc.falseStarts,
      wrongPresses: doc.wrongPresses,
      timeouts: doc.timeouts,
      totalScore: doc.totalScore,
      averageTimeMs: doc.averageTimeMs ?? null,
      bestTimeMs: doc.bestTimeMs ?? null,
      standardDeviationMs: doc.standardDeviationMs ?? null,
      scoringVersion: doc.scoringVersion,
      startedAt: doc.startedAt.toISOString(),
      finishedAt: doc.finishedAt?.toISOString() ?? null,
      attempts: [...doc.attempts]
        .sort((a, b) => a.attemptNumber - b.attemptNumber)
        .map((a) => ({
          attemptNumber: a.attemptNumber,
          command: a.command,
          waitTimeMs: a.waitTimeMs ?? null,
          windowMs: a.windowMs,
          pressedAfterMs: a.pressedAfterMs ?? null,
          result: a.result,
          reactionTimeMs: a.reactionTimeMs ?? null,
          score: a.score,
        })),
    })
  }
}