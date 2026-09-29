import { describe, expect, it } from 'vitest'
import { COLETA_CORES_VAZIA, aplicarEventoCores, temRodadas, type ColetaCores } from './coletor'
import type { EventoGenius } from './cores.config'

function rodar(eventos: [EventoGenius, number][], inicial: ColetaCores = COLETA_CORES_VAZIA): ColetaCores {
  return eventos.reduce((coleta, [evento, agora]) => aplicarEventoCores(coleta, evento, agora), inicial)
}

describe('aplicarEventoCores', () => {
  it('uma partida: dois acertos e um erro que encerra', () => {
    const c = rodar([
      [{ evento: 'pronto_para_iniciar' }, 0],
      [{ evento: 'inicio_rodada', rodada: 1 }, 100],
      [{ evento: 'tocar_cor', cor: 2 }, 200],
      [{ evento: 'sua_vez', total: 1 }, 1000],
      [{ evento: 'botao_pressionado', cor: 2 }, 1800],
      [{ evento: 'acertou_rodada', pontuacao: 1 }, 1900],
      [{ evento: 'inicio_rodada', rodada: 2 }, 2500],
      [{ evento: 'sua_vez', total: 2 }, 4000],
      [{ evento: 'acertou_rodada', pontuacao: 2 }, 6000],
      [{ evento: 'inicio_rodada', rodada: 3 }, 6500],
      [{ evento: 'sua_vez', total: 3 }, 9000],
      [{ evento: 'game_over', pontuacao_final: 2 }, 12000],
    ])
    expect(c.rodadas).toEqual([
      { rodada: 1, tamanhoSequencia: 1, acertou: true, tempoRespostaMs: 900 },
      { rodada: 2, tamanhoSequencia: 2, acertou: true, tempoRespostaMs: 2000 },
      { rodada: 3, tamanhoSequencia: 3, acertou: false, tempoRespostaMs: 3000 },
    ])
    expect(c.terminou).toBe(true)
    expect(c.pontuacao).toBe(2)
  })

  it('game over logo depois de um acerto não cria uma rodada fantasma', () => {
    const c = rodar([
      [{ evento: 'inicio_rodada', rodada: 1 }, 0],
      [{ evento: 'sua_vez', total: 1 }, 100],
      [{ evento: 'acertou_rodada', pontuacao: 1 }, 600],
      [{ evento: 'game_over', pontuacao_final: 1 }, 700],
    ])
    expect(c.rodadas).toHaveLength(1)
    expect(c.terminou).toBe(true)
  })

  it('numera as rodadas em ordem, mesmo que o firmware numere diferente', () => {
    const c = rodar([
      [{ evento: 'inicio_rodada', rodada: 5 }, 0],
      [{ evento: 'sua_vez', total: 5 }, 10],
      [{ evento: 'acertou_rodada' }, 20],
      [{ evento: 'inicio_rodada', rodada: 9 }, 30],
      [{ evento: 'sua_vez', total: 6 }, 40],
      [{ evento: 'acertou_rodada' }, 50],
    ])
    expect(c.rodadas.map((r) => r.rodada)).toEqual([1, 2])
    expect(c.rodadas.map((r) => r.tamanhoSequencia)).toEqual([5, 6])
  })

  it('sem sua_vez, o tempo fica sem medir e o tamanho cai no número da rodada', () => {
    const c = rodar([
      [{ evento: 'inicio_rodada', rodada: 4 }, 0],
      [{ evento: 'acertou_rodada' }, 500],
    ])
    expect(c.rodadas).toEqual([{ rodada: 1, tamanhoSequencia: 4, acertou: true, tempoRespostaMs: null }])
  })

  it('errar na primeira rodada ainda gera uma rodada (errada)', () => {
    const c = rodar([
      [{ evento: 'inicio_rodada', rodada: 1 }, 0],
      [{ evento: 'sua_vez', total: 1 }, 100],
      [{ evento: 'game_over', pontuacao_final: 0 }, 900],
    ])
    expect(c.rodadas).toEqual([{ rodada: 1, tamanhoSequencia: 1, acertou: false, tempoRespostaMs: 800 }])
    expect(c.pontuacao).toBe(0)
  })

  it('pronto_para_iniciar começa uma partida nova, descartando a coleta anterior', () => {
    const jogada = rodar([
      [{ evento: 'inicio_rodada', rodada: 1 }, 0],
      [{ evento: 'acertou_rodada' }, 10],
    ])
    expect(temRodadas(jogada)).toBe(true)
    expect(aplicarEventoCores(jogada, { evento: 'pronto_para_iniciar' }, 20)).toEqual(COLETA_CORES_VAZIA)
  })

  it('sem game_over, usa a última pontuação informada em um acerto', () => {
    const c = rodar([
      [{ evento: 'inicio_rodada', rodada: 1 }, 0],
      [{ evento: 'acertou_rodada', pontuacao: 7 }, 10],
    ])
    expect(c.pontuacao).toBe(7)
    expect(c.terminou).toBe(false)
  })

  it('limita um tempo absurdo e eventos de cor não mudam a coleta', () => {
    const c = rodar([
      [{ evento: 'inicio_rodada', rodada: 1 }, 0],
      [{ evento: 'sua_vez', total: 1 }, 0],
      [{ evento: 'tocar_cor', cor: 1 }, 50],
      [{ evento: 'botao_pressionado', cor: 1 }, 60],
      [{ evento: 'acertou_rodada' }, 99_999_999],
    ])
    expect(c.rodadas[0].tempoRespostaMs).toBe(600_000)
  })

  it('não altera a coleta anterior (é uma função pura)', () => {
    const antes = rodar([[{ evento: 'inicio_rodada', rodada: 1 }, 0]])
    const copia = structuredClone(antes)
    aplicarEventoCores(antes, { evento: 'game_over' }, 10)
    expect(antes).toEqual(copia)
  })
})
