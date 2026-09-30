import { describe, expect, it } from 'vitest'
import { TEMPO_MAXIMO_MS } from '@iris/contracts'
import { COLETA_REFLEXO_VAZIA, aplicarEventoReflexo, type ColetaReflexo } from './coletor'
import type { EventoEsp32 } from './hooks/useEsp32Serial'

/** Aplica uma sequência de [evento, instante] na coleta. */
function rodar(eventos: [EventoEsp32, number][]): ColetaReflexo {
  return eventos.reduce((coleta, [evento, agora]) => aplicarEventoReflexo(coleta, evento, agora), COLETA_REFLEXO_VAZIA)
}

describe('aplicarEventoReflexo', () => {
  it('uma rodada boa: espera medida no navegador e reação medida pelo ESP32', () => {
    const { tentativas } = rodar([
      [{ status: 'contagem', valor: 3 }, 0],
      [{ status: 'esperando' }, 1000],
      [{ status: 'reagir' }, 4200],
      [{ status: 'sucesso', valor: 287 }, 4487],
    ])
    expect(tentativas).toEqual([{ rodada: 1, tempoEsperaMs: 3200, tempoReacaoMs: 287, queimou: false, acionamento: 'ESP32_BUTTON' }])
  })

  it('queimar a largada não tem tempo de reação, e a espera vai até o aperto antes da hora', () => {
    const { tentativas } = rodar([
      [{ status: 'esperando' }, 1000],
      [{ status: 'queimou' }, 1800],
    ])
    expect(tentativas).toEqual([{ rodada: 1, tempoEsperaMs: 800, tempoReacaoMs: null, queimou: true, acionamento: 'ESP32_BUTTON' }])
  })

  it('numera as rodadas em sequência e zera a espera entre elas', () => {
    const { tentativas } = rodar([
      [{ status: 'esperando' }, 0],
      [{ status: 'reagir' }, 2000],
      [{ status: 'sucesso', valor: 250 }, 2250],
      [{ status: 'esperando' }, 5000],
      [{ status: 'queimou' }, 5500],
      [{ status: 'esperando' }, 9000],
      [{ status: 'reagir' }, 12000],
      [{ status: 'sucesso', valor: 310 }, 12310],
    ])
    expect(tentativas.map((t) => t.rodada)).toEqual([1, 2, 3])
    expect(tentativas.map((t) => t.tempoEsperaMs)).toEqual([2000, 500, 3000])
  })

  it('sem o evento esperando, a espera fica 0 em vez de inventar um número', () => {
    const { tentativas } = rodar([
      [{ status: 'reagir' }, 3000],
      [{ status: 'sucesso', valor: 300 }, 3300],
    ])
    expect(tentativas[0].tempoEsperaMs).toBe(0)
  })

  it('aceita o valor como texto e arredonda', () => {
    const { tentativas } = rodar([[{ status: 'sucesso', valor: '245.6' }, 0]])
    expect(tentativas[0].tempoReacaoMs).toBe(246)
  })

  it('valor que não é número não vira tentativa', () => {
    expect(rodar([[{ status: 'sucesso', valor: 'abc' }, 0]]).tentativas).toEqual([])
    expect(rodar([[{ status: 'sucesso' }, 0]]).tentativas).toEqual([])
    expect(rodar([[{ status: 'sucesso', valor: -10 }, 0]]).tentativas).toEqual([])
  })

  it('limita tempos absurdos, para uma leitura ruim não invalidar a sessão inteira no servidor', () => {
    const { tentativas } = rodar([
      [{ status: 'esperando' }, 0],
      [{ status: 'reagir' }, 999_999],
      [{ status: 'sucesso', valor: 9_999_999 }, 0],
    ])
    expect(tentativas[0].tempoEsperaMs).toBe(TEMPO_MAXIMO_MS)
    expect(tentativas[0].tempoReacaoMs).toBe(TEMPO_MAXIMO_MS)
  })

  it('a contagem regressiva não gera tentativa', () => {
    expect(rodar([[{ status: 'contagem', valor: 3 }, 0]])).toEqual(COLETA_REFLEXO_VAZIA)
  })

  it('não altera a coleta anterior (é uma função pura)', () => {
    const antes = rodar([[{ status: 'esperando' }, 100]])
    const copia = structuredClone(antes)
    aplicarEventoReflexo(antes, { status: 'queimou' }, 500)
    expect(antes).toEqual(copia)
  })
})
