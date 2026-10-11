import { describe, expect, it } from 'vitest'
import { resumirCores } from './cores'
import { resumirReflexo } from './reflexo'

describe('resumirReflexo', () => {
  it('calcula média e melhor tempo só das reações válidas', () => {
    const r = resumirReflexo([
      { queimou: false, tempoReacaoMs: 300 },
      { queimou: false, tempoReacaoMs: 200 },
      { queimou: true, tempoReacaoMs: null },
    ])
    expect(r).toEqual({ validas: 2, queimadas: 1, tempoMedioMs: 250, melhorTempoMs: 200 })
  })

  it('não usa o tempo de uma rodada queimada, mesmo que venha preenchido', () => {
    expect(resumirReflexo([{ queimou: true, tempoReacaoMs: 5 }]).melhorTempoMs).toBeNull()
  })

  it('sem reações válidas, não há média nem melhor tempo', () => {
    expect(resumirReflexo([])).toEqual({ validas: 0, queimadas: 0, tempoMedioMs: null, melhorTempoMs: null })
  })

  it('arredonda a média para 2 casas', () => {
    const r = resumirReflexo([
      { queimou: false, tempoReacaoMs: 100 },
      { queimou: false, tempoReacaoMs: 101 },
      { queimou: false, tempoReacaoMs: 101 },
    ])
    expect(r.tempoMedioMs).toBe(100.67)
  })
})

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
