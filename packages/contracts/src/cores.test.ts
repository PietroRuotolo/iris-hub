import { describe, expect, it } from 'vitest'
import { avaliarFaseCores, pontuarFaseCores, resumirCores, resumirFasesCores } from './cores'

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
describe('cores em 5 fases', () => {
  const fase = (sequencia: number[], tempoRespostaMs: number | null, resultado: 'acerto' | 'errou' | 'demorou' = 'acerto') => ({ sequencia, tempoRespostaMs, resultado })

  it('avalia a fase: na ordem e completa é acerto; uma cor fora da ordem é erro; o tempo acabar é demora', () => {
    expect(avaliarFaseCores([1, 2, 3], [1, 2, 3], false)).toBe('acerto')
    expect(avaliarFaseCores([1, 2, 3], [1, 3], false)).toBe('errou')
    expect(avaliarFaseCores([1, 2, 3], [1, 2], true)).toBe('demorou')
    expect(avaliarFaseCores([1, 2, 3], [], true)).toBe('demorou')
    expect(avaliarFaseCores([1, 2, 3], [2], true)).toBe('errou')
  })

  it('o acerto vale de 60 a 100 pelo ritmo (ms por cor); errar ou demorar vale 0', () => {
    expect(pontuarFaseCores(fase([1, 2, 3], 1200))).toBe(100) // 400 ms por cor
    expect(pontuarFaseCores(fase([1, 2, 3], 600))).toBe(100) // mais rápido que o ideal
    expect(pontuarFaseCores(fase([1, 2, 3], 7500))).toBe(60) // 2500 ms por cor, o limite
    expect(pontuarFaseCores(fase([1, 2, 3, 4], 5800))).toBe(80) // 1450 ms por cor, no meio
    expect(pontuarFaseCores(fase([1, 2, 3], 900, 'errou'))).toBe(0)
    expect(pontuarFaseCores(fase([1, 2, 3], null, 'demorou'))).toBe(0)
  })

  it('resume a partida: acertos, maior sequência, ritmo médio e pontos', () => {
    const r = resumirFasesCores([fase([1, 2, 3], 1200), fase([1, 2, 3, 4], 5800), fase([0, 1, 2, 3, 4], 2000, 'errou'), fase([1, 2, 3, 4, 0, 1], null, 'demorou')])
    expect(r).toEqual({ fases: 4, acertos: 2, erros: 1, demoras: 1, maiorSequencia: 4, ritmoMedioPorCorMs: 925, pontos: 180 })
    expect(resumirFasesCores([])).toMatchObject({ acertos: 0, maiorSequencia: 0, ritmoMedioPorCorMs: null, pontos: 0 })
  })
})