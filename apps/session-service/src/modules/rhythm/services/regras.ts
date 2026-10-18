// Regras de uma partida do ritmo recebida do site e o cálculo dos pontos (puros, testados à parte). Os
// pontos são recalculados aqui com as mesmas funções que o site usa na tela (packages/contracts), a
// partir do que o site mediu em cada alvo: o serviço não confia nos pontos que o site mostrou.

import {
  FASES_JOGO,
  VERSAO_PONTUACAO,
  notasTentativa,
  pontuarTentativa,
  resumirFase,
  resumirSessao,
  type ResultadoAlvoSalvo,
  type ResultadoTentativa,
} from '@iris/contracts'
import type { Prisma } from '@prisma/client'

export interface AlvoRecebido {
  targetNumber: number
  result: ResultadoAlvoSalvo
  byMagnet: boolean
  targetX: number
  targetY: number
  targetRadiusPx: number
  windowMs: number
  trackingCoverage: number
  entryOffsetMs?: number | null
  latencyMs?: number | null
  dwellTimeMs?: number | null
  averageCenterDistancePx?: number | null
}

export interface FaseRecebida {
  phaseNumber: number
  targetRadiusCm: number
  beatIntervalMs: number
  startedAt: string
  finishedAt: string
  targets: AlvoRecebido[]
}

export interface PartidaRecebida {
  id: string
  playerId: string
  status: 'completed' | 'abandoned'
  startedAt: string
  phases: FaseRecebida[]
}

const PARA_CONTRATO: Record<ResultadoAlvoSalvo, ResultadoTentativa> = {
  hit: 'ACERTO',
  no_response: 'SEM_RESPOSTA',
  insufficient_tracking: 'RASTREAMENTO_INSUFICIENTE',
}

const temValor = (v: number | null | undefined): v is number => typeof v === 'number'
const arredondar = (v: number, casas: number) => Math.round(v * 10 ** casas) / 10 ** casas

export function problemasDaPartida(partida: Pick<PartidaRecebida, 'status' | 'startedAt' | 'phases'>): string[] {
  const problemas: string[] = []

  partida.phases.forEach((f, i) => {
    const onde = `phases.${i}`
    if (f.phaseNumber !== i + 1) problemas.push(`${onde}.phaseNumber: as fases precisam vir em ordem, a partir da 1`)
    if (Date.parse(f.finishedAt) < Date.parse(f.startedAt)) problemas.push(`${onde}.finishedAt: antes do começo da fase`)
    if (Date.parse(f.startedAt) < Date.parse(partida.startedAt)) problemas.push(`${onde}.startedAt: antes do começo da partida`)

    f.targets.forEach((a, j) => {
      const alvo = `${onde}.targets.${j}`
      if (a.targetNumber !== j + 1) problemas.push(`${alvo}.targetNumber: os alvos precisam vir em ordem (1, 2, 3...)`)
      if (a.result === 'hit') {
        if (!temValor(a.entryOffsetMs)) problemas.push(`${alvo}.entryOffsetMs: obrigatório no acerto`)
        else if (Math.abs(a.entryOffsetMs) > a.windowMs) problemas.push(`${alvo}.entryOffsetMs: fora da janela de acerto`)
      } else {
        if (a.byMagnet) problemas.push(`${alvo}.byMagnet: só um acerto pode ser pelo ímã`)
        for (const campo of ['entryOffsetMs', 'dwellTimeMs', 'averageCenterDistancePx'] as const) {
          if (temValor(a[campo])) problemas.push(`${alvo}.${campo}: só existe no acerto`)
        }
      }
    })
  })

  const completa = partida.phases.length === FASES_JOGO.length
  if (partida.status === 'completed' && !completa) problemas.push(`status: uma partida completed tem as ${FASES_JOGO.length} fases`)
  if (partida.status === 'abandoned' && completa) problemas.push(`status: a partida terminou as ${FASES_JOGO.length} fases, não foi abandonada`)
  return problemas
}

/** O alvo no formato das regras de pontuação (packages/contracts). */
function paraTentativa(a: AlvoRecebido) {
  return {
    resultado: PARA_CONTRATO[a.result],
    erroTempoMs: temValor(a.entryOffsetMs) ? Math.abs(a.entryOffsetMs) : null,
    janelaMs: a.windowMs,
    erroEspacial: temValor(a.averageCenterDistancePx) ? a.averageCenterDistancePx / a.targetRadiusPx : null,
    cobertura: a.trackingCoverage,
    peloIma: a.byMagnet,
  }
}

/** A partida pronta para gravar, com os pontos de cada alvo, de cada fase e o total. */
export function montarPartida(partida: PartidaRecebida, agora: Date): Prisma.RhythmSessionUncheckedCreateInput {
  const fases = partida.phases.map((f) => {
    const tentativas = f.targets.map(paraTentativa)
    const nome = FASES_JOGO.find((c) => c.fase === f.phaseNumber)?.nome ?? `Fase ${f.phaseNumber}`
    const resumo = resumirFase(f.phaseNumber, nome, tentativas)
    const temValidos = resumo.rastreamentoInsuficiente < resumo.alvosApresentados
    return { f, tentativas, resumo, temValidos }
  })
  const { pontuacaoTotal } = resumirSessao(fases.map(({ resumo }) => resumo))
  const soma = (campo: 'acertos' | 'semResposta' | 'rastreamentoInsuficiente') => fases.reduce((s, { resumo }) => s + resumo[campo], 0)

  return {
    id: partida.id,
    playerId: partida.playerId,
    status: partida.status,
    // Sem nenhum alvo com olhar suficiente na partida inteira, não há pontuação (e não zero).
    totalScore: fases.some((x) => x.temValidos) ? pontuacaoTotal : null,
    phasesCompleted: fases.length,
    totalHits: soma('acertos'),
    totalMisses: soma('semResposta'),
    totalInsufficientTracking: soma('rastreamentoInsuficiente'),
    scoringVersion: VERSAO_PONTUACAO,
    startedAt: new Date(partida.startedAt),
    finishedAt: agora,
    phases: {
      create: fases.map(({ f, tentativas, resumo, temValidos }) => ({
        phaseNumber: f.phaseNumber,
        status: 'completed' as const,
        score: temValidos ? resumo.pontuacao : null,
        totalTargets: resumo.alvosApresentados,
        hits: resumo.acertos,
        misses: resumo.semResposta,
        insufficientTracking: resumo.rastreamentoInsuficiente,
        trackingCoverage: resumo.coberturaRastreamento === null ? null : arredondar(resumo.coberturaRastreamento * 100, 1),
        targetRadiusCm: f.targetRadiusCm,
        beatIntervalMs: f.beatIntervalMs,
        startedAt: new Date(f.startedAt),
        finishedAt: new Date(f.finishedAt),
        targets: {
          create: f.targets.map((a, i) => {
            const notas = notasTentativa(tentativas[i])
            return {
              targetNumber: a.targetNumber,
              result: a.result,
              score: a.result === 'insufficient_tracking' ? null : pontuarTentativa(tentativas[i]),
              byMagnet: a.byMagnet,
              targetX: a.targetX,
              targetY: a.targetY,
              latencyMs: a.latencyMs ?? null,
              entryOffsetMs: a.entryOffsetMs ?? null,
              dwellTimeMs: a.dwellTimeMs ?? null,
              averageCenterDistancePx: a.averageCenterDistancePx ?? null,
              targetRadiusPx: a.targetRadiusPx,
              timeScore: notas ? arredondar(notas.notaTempo, 3) : null,
              precisionScore: notas ? arredondar(notas.notaPrecisao, 3) : null,
              trackingCoverage: arredondar(a.trackingCoverage * 100, 1),
            }
          }),
        },
      })),
    },
  }
}
