import { describe, expect, it } from 'vitest'
import { COLETA_CORES_VAZIA, aplicarEventoCores } from '@/features/jogo-cores/coletor'
import { COLETA_REFLEXO_VAZIA, aplicarEventoReflexo } from '@/features/jogo-reflexo/coletor'
import { roteiroCores, roteiroReflexo, type Passo } from './simulador'

/** Passa o roteiro pelo coletor de verdade, com o relógio andando conforme as esperas. */
function coletar<E, C>(passos: Passo<E>[], inicial: C, aplicar: (c: C, e: E, agora: number) => C): C {
  let agora = 0
  return passos.reduce((coleta, { depoisMs, evento }) => aplicar(coleta, evento, (agora += depoisMs)), inicial)
}

const fixo = () => 0.5

describe('simulador do ESP32', () => {
  it('uma rodada do reflexo vira uma tentativa válida, com o tempo que o "ESP32" informou', () => {
    const coleta = coletar(roteiroReflexo(false, fixo), COLETA_REFLEXO_VAZIA, aplicarEventoReflexo)
    expect(coleta.tentativas).toEqual([{ rodada: 1, tempoEsperaMs: 1750, tempoReacaoMs: 315, queimou: false, acionamento: 'ESP32_BUTTON' }])
  })

  it('a largada queimada vira tentativa sem tempo de reação', () => {
    const [tentativa] = coletar(roteiroReflexo(true, fixo), COLETA_REFLEXO_VAZIA, aplicarEventoReflexo).tentativas
    expect(tentativa).toMatchObject({ queimou: true, tempoReacaoMs: null })
  })

  it('uma partida das cores com 3 acertos grava 4 rodadas (a última errada) e termina', () => {
    const coleta = coletar(roteiroCores(3, fixo), COLETA_CORES_VAZIA, aplicarEventoCores)
    expect(coleta.terminou).toBe(true)
    expect(coleta.pontuacao).toBe(3)
    expect(coleta.rodadas.map((r) => [r.rodada, r.tamanhoSequencia, r.acertou])).toEqual([
      [1, 1, true],
      [2, 2, true],
      [3, 3, true],
      [4, 4, false],
    ])
  })
})
