import { describe, expect, it } from 'vitest'
import { resumirCores } from './cores'

describe('resumirCores', () => {
  const rodada = (tamanhoSequencia: number, acertou: boolean, tempoRespostaMs: number | null) => ({ tamanhoSequencia, acertou, tempoRespostaMs })

  it('a maior sequência é a maior repetida sem erro', () => {
    const r = resumirCores([rodada(1, true, 900), rodada(2, true, 1500), rodada(3, false, 4000)])
    expect(r.maiorSequencia).toBe(2)
    expect(r.acertos).toBe(2)
    expect(r.rodadasJogadas).toBe(3)
  })

  it('o tempo médio ignora a rodada errada', () => {
    const r = resumirCores([rodada(1, true, 1000), rodada(2, true, 2000), rodada(3, false, 9000)])
    expect(r.tempoRespostaMedioMs).toBe(1500)
  })

  it('errar logo na primeira rodada dá sequência 0 e nenhum tempo', () => {
    const r = resumirCores([rodada(1, false, 3000)])
    expect(r).toEqual({ rodadasJogadas: 1, acertos: 0, maiorSequencia: 0, tempoRespostaMedioMs: null })
  })

  it('ignora tempos não medidos', () => {
    const r = resumirCores([rodada(1, true, null), rodada(2, true, 1000)])
    expect(r.tempoRespostaMedioMs).toBe(1000)
  })
})