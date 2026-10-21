// Regras de uma partida do reflexo recebida do site e o cálculo do que vai para o banco (puros, testados à
// parte). O site manda só o que mediu em cada fase (a ordem, a espera, o tempo para responder e quando a
// pessoa apertou); o resultado, os pontos e o consolidado são calculados aqui, com as mesmas funções que o
// site usa na tela (packages/contracts): o serviço não confia no que o site mostrou.

import {
  TOTAL_FASES_REFLEXO,
  VERSAO_PONTUACAO_REFLEXO,
  avaliarRodada,
  pontuarRodada,
  resumirReflexo,
  type AcionamentoReflexo,
  type OrdemMestre,
  type ResultadoRodada,
} from '@iris/contracts'
import type { Prisma } from '@prisma/client'

/** A ordem como fica no banco: press = "APERTE!"; hold = "NÃO APERTE!". */
export type ComandoSalvo = 'press' | 'hold'
export type ResultadoSalvo = 'success' | 'held' | 'timeout' | 'wrong_press' | 'false_start'

export const PARA_ORDEM: Record<ComandoSalvo, OrdemMestre> = { press: 'apertar', hold: 'nao_apertar' }
export const PARA_BANCO: Record<ResultadoRodada, ResultadoSalvo> = {
  acerto: 'success',
  segurou: 'held',
  atrasado: 'timeout',
  apertou_errado: 'wrong_press',
  antecipacao: 'false_start',
}

export interface FaseRecebida {
  attemptNumber: number
  command: ComandoSalvo
  waitTimeMs: number
  windowMs: number
  /** ms da ordem até o aperto: negativo = antes da ordem; null = não apertou. */
  pressedAfterMs: number | null
}

export interface PartidaRecebida {
  id: string
  playerId: string
  status: 'completed' | 'abandoned'
  inputSource: AcionamentoReflexo
  startedAt: string
  attempts: FaseRecebida[]
}

export function problemasDaPartida(partida: Pick<PartidaRecebida, 'status' | 'attempts'>): string[] {
  const problemas: string[] = []
  partida.attempts.forEach((f, i) => {
    const onde = `attempts.${i}`
    if (f.attemptNumber !== i + 1) problemas.push(`${onde}.attemptNumber: as fases precisam vir em ordem, a partir da 1`)
    // Apertar antes da ordem só pode ter acontecido durante a espera.
    if (f.pressedAfterMs !== null && f.pressedAfterMs < -f.waitTimeMs) problemas.push(`${onde}.pressedAfterMs: antes do começo da espera`)
  })
  const completa = partida.attempts.length === TOTAL_FASES_REFLEXO
  if (partida.status === 'completed' && !completa) problemas.push(`status: uma partida completed tem as ${TOTAL_FASES_REFLEXO} fases`)
  if (partida.status === 'abandoned' && completa) problemas.push(`status: a partida terminou as ${TOTAL_FASES_REFLEXO} fases, não foi abandonada`)
  return problemas
}

/** Cada fase avaliada com as regras do jogo (as mesmas do site). */
export function avaliarFases(fases: FaseRecebida[]) {
  return fases.map((f) => {
    const { resultado, tempoReacaoMs } = avaliarRodada(PARA_ORDEM[f.command], f.pressedAfterMs, f.windowMs)
    return { f, resultado, tempoReacaoMs, pontos: pontuarRodada({ resultado, tempoReacaoMs, janelaMs: f.windowMs }) }
  })
}

/** A partida pronta para gravar: as fases com resultado e pontos, e o consolidado. */
export function montarPartida(partida: PartidaRecebida, agora: Date): Prisma.ReflexSessionUncheckedCreateInput {
  const fases = avaliarFases(partida.attempts)
  const resumo = resumirReflexo(fases.map(({ f, resultado, tempoReacaoMs }) => ({ resultado, tempoReacaoMs, janelaMs: f.windowMs })))
  return {
    id: partida.id,
    playerId: partida.playerId,
    status: partida.status,
    inputSource: partida.inputSource,
    totalAttempts: resumo.rodadas,
    validAttempts: resumo.acertos + resumo.segurou,
    falseStarts: resumo.antecipacoes,
    wrongPresses: resumo.apertouErrado,
    timeouts: resumo.atrasados,
    totalScore: resumo.pontos,
    averageTimeMs: resumo.tempoMedioMs,
    bestTimeMs: resumo.melhorTempoMs,
    standardDeviationMs: resumo.desvioPadraoMs,
    scoringVersion: VERSAO_PONTUACAO_REFLEXO,
    startedAt: new Date(partida.startedAt),
    finishedAt: agora,
    attempts: {
      create: fases.map(({ f, resultado, tempoReacaoMs, pontos }) => ({
        attemptNumber: f.attemptNumber,
        command: f.command,
        waitTimeMs: f.waitTimeMs,
        windowMs: f.windowMs,
        pressedAfterMs: f.pressedAfterMs,
        result: PARA_BANCO[resultado],
        // Só guarda o tempo de reação de quem apertou depois da ordem.
        reactionTimeMs: resultado === 'antecipacao' ? null : tempoReacaoMs,
        score: pontos,
      })),
    },
  }
}