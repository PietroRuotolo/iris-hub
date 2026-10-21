// Regras de uma partida das cores recebida do site e o cálculo do que vai para o banco (puros, testados à
// parte). O site manda só o que mediu em cada fase (a sequência mostrada, as cores apertadas e o tempo); o
// resultado, os pontos e o consolidado são calculados aqui, com as mesmas funções que o site usa na tela
// (packages/contracts): o serviço não confia no que o site mostrou.

import {
  TAMANHOS_FASES_CORES,
  TEMPO_POR_COR_MS,
  TOTAL_FASES_CORES,
  VERSAO_PONTUACAO_CORES,
  avaliarFaseCores,
  pontuarFaseCores,
  resumirFasesCores,
  type PartidaCores,
  type ResultadoFaseCores,
} from '@iris/contracts'
import type { Prisma } from '@prisma/client'

export type AcionamentoCores = PartidaCores['acionamento']
export const ACIONAMENTOS_CORES: readonly AcionamentoCores[] = ['ESP32_BUTTON', 'MOUSE_CLICK', 'KEYBOARD']

export type ResultadoSalvo = 'success' | 'wrong_color' | 'timeout'
export const PARA_BANCO: Record<ResultadoFaseCores, ResultadoSalvo> = { acerto: 'success', errou: 'wrong_color', demorou: 'timeout' }

/** Folga sobre o tempo da fase: o último aperto pode chegar um instante depois do fim do relógio. */
export const FOLGA_TEMPO_MS = 1000

export interface FaseRecebida {
  roundNumber: number
  /** A sequência mostrada (cores de 0 a 4). */
  expectedSequence: number[]
  /** As cores apertadas, na ordem (para no primeiro erro). */
  playerSequence: number[]
  /** Do começo da vez da pessoa até o último aperto; null se não apertou nada. */
  responseTimeMs: number | null
}

export interface PartidaRecebida {
  id: string
  playerId: string
  status: 'completed' | 'abandoned'
  inputSource: AcionamentoCores
  startedAt: string
  rounds: FaseRecebida[]
}

export function problemasDaPartida(partida: Pick<PartidaRecebida, 'status' | 'rounds'>): string[] {
  const problemas: string[] = []
  partida.rounds.forEach((f, i) => {
    const onde = `rounds.${i}`
    if (f.roundNumber !== i + 1) problemas.push(`${onde}.roundNumber: as fases precisam vir em ordem, a partir da 1`)
    const tamanho = TAMANHOS_FASES_CORES.at(i)
    if (tamanho !== undefined && f.expectedSequence.length !== tamanho) {
      problemas.push(`${onde}.expectedSequence: a fase ${i + 1} tem ${tamanho} cores`)
    }
    if (f.playerSequence.length > f.expectedSequence.length) problemas.push(`${onde}.playerSequence: mais apertos que cores na sequência`)
    // Os apertos param no primeiro erro: antes do último, todos seguem a sequência.
    if (f.playerSequence.slice(0, -1).some((cor, j) => cor !== f.expectedSequence.at(j))) {
      problemas.push(`${onde}.playerSequence: continua depois de um erro`)
    }
    if ((f.responseTimeMs === null) !== (f.playerSequence.length === 0)) {
      problemas.push(`${onde}.responseTimeMs: tem que vir quando houve aperto, e só então`)
    }
    if (f.responseTimeMs !== null && f.responseTimeMs > f.expectedSequence.length * TEMPO_POR_COR_MS + FOLGA_TEMPO_MS) {
      problemas.push(`${onde}.responseTimeMs: passou do tempo da fase`)
    }
  })
  const completa = partida.rounds.length === TOTAL_FASES_CORES
  if (partida.status === 'completed' && !completa) problemas.push(`status: uma partida completed tem as ${TOTAL_FASES_CORES} fases`)
  if (partida.status === 'abandoned' && completa) problemas.push(`status: a partida terminou as ${TOTAL_FASES_CORES} fases, não foi abandonada`)
  return problemas
}

/**
 * Cada fase avaliada com as regras do jogo (as mesmas do site). Uma sequência incompleta e sem erro só
 * fecha quando o tempo acaba (encerrar no meio não grava a fase em curso): é "demorou".
 */
export function avaliarFases(fases: FaseRecebida[]) {
  return fases.map((f) => {
    const resultado = avaliarFaseCores(f.expectedSequence, f.playerSequence, true)
    const medida = { resultado, tempoRespostaMs: f.responseTimeMs, sequencia: f.expectedSequence }
    return { f, resultado, pontos: pontuarFaseCores(medida), medida }
  })
}

/** A partida pronta para gravar: as fases com resultado e pontos, e o consolidado. */
export function montarPartida(partida: PartidaRecebida, agora: Date): Prisma.ColorSessionUncheckedCreateInput {
  const fases = avaliarFases(partida.rounds)
  const resumo = resumirFasesCores(fases.map((x) => x.medida))
  return {
    id: partida.id,
    playerId: partida.playerId,
    status: partida.status,
    inputSource: partida.inputSource,
    score: resumo.pontos,
    roundsCompleted: resumo.acertos,
    totalErrors: resumo.erros,
    timeouts: resumo.demoras,
    maxSequenceLength: resumo.maiorSequencia,
    averageMsPerColor: resumo.ritmoMedioPorCorMs,
    scoringVersion: VERSAO_PONTUACAO_CORES,
    startedAt: new Date(partida.startedAt),
    finishedAt: agora,
    rounds: {
      create: fases.map(({ f, resultado, pontos }) => ({
        roundNumber: f.roundNumber,
        sequenceLength: f.expectedSequence.length,
        expectedSequence: f.expectedSequence,
        playerSequence: f.playerSequence,
        responseTimeMs: f.responseTimeMs,
        result: PARA_BANCO[resultado],
        score: pontos,
      })),
    },
  }
}