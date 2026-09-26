import { describe, expect, it } from 'vitest'
import {
  agregar,
  agruparPorJogo,
  codificarResumo,
  decodificarResumo,
  ehPadrao,
  interpretar,
  lerSessao,
  montarGrupos,
  nomeJogo,
  PADRAO_GENERICO,
  resumoPadrao,
} from './laudo'

const sessaoBase = {
  acertos: 6,
  erros: 2,
  detalhePorAlvo: [
    { acerto: true, tempoRespostaMs: 400, precisaoPx: 20, variabilidadeFixacaoPx: 5 },
    { acerto: true, tempoRespostaMs: 600, precisaoPx: 30, variabilidadeFixacaoPx: 7 },
    { acerto: false, tempoRespostaMs: null },
  ],
}

describe('lerSessao', () => {
  it('normaliza uma sessão válida', () => {
    const s = lerSessao(sessaoBase)
    expect(s.acertos).toBe(6)
    expect(s.alvos).toHaveLength(3)
    expect(s.alvos[2].tempoRespostaMs).toBeNull()
  })

  it('sem o campo "jogo", assume jogo-ritmo', () => {
    expect(lerSessao(sessaoBase).jogo).toBe('jogo-ritmo')
  })

  it('preserva o campo "jogo" quando presente', () => {
    expect(lerSessao({ ...sessaoBase, jogo: 'outro-jogo' }).jogo).toBe('outro-jogo')
  })

  it('rejeita arquivos sem acertos/erros numéricos', () => {
    expect(() => lerSessao({ acertos: '3', erros: 1 })).toThrow(/acertos/)
    expect(() => lerSessao(null)).toThrow()
    expect(() => lerSessao([])).toThrow()
  })
})

describe('agruparPorJogo', () => {
  it('agrupa mantendo a ordem de primeira aparição', () => {
    const a = lerSessao({ ...sessaoBase, jogo: 'jogo-ritmo' })
    const b = lerSessao({ ...sessaoBase, jogo: 'outro-jogo' })
    const c = lerSessao({ ...sessaoBase, jogo: 'jogo-ritmo' })
    const grupos = agruparPorJogo([a, b, c])
    expect(grupos.map((g) => g.jogo)).toEqual(['jogo-ritmo', 'outro-jogo'])
    expect(grupos[0].sessoes).toHaveLength(2)
    expect(grupos[1].sessoes).toHaveLength(1)
  })
})

describe('nomeJogo', () => {
  it('resolve um nome conhecido e cai no id para um jogo desconhecido', () => {
    expect(nomeJogo('jogo-ritmo')).toBe('Jogo de ritmo por rastreamento ocular')
    expect(nomeJogo('futuro-jogo')).toBe('futuro-jogo')
  })
})

describe('agregar', () => {
  it('soma acertos/erros e usa os tempos por alvo', () => {
    const r = agregar([lerSessao(sessaoBase), lerSessao(sessaoBase)])
    expect(r.sessoes).toBe(2)
    expect(r.acertos).toBe(12)
    expect(r.erros).toBe(4)
    expect(r.taxaAcerto).toBeCloseTo(0.75)
    expect(r.tempoMedioMs).toBeCloseTo(500)
    expect(r.desvioMs).toBeCloseTo(100)
    expect(r.precisaoPx).toBeCloseTo(25)
  })

  it('sem detalhe por alvo, pondera as médias das sessões', () => {
    const a = lerSessao({ acertos: 3, erros: 1, tempoRespostaMedioMs: 400, tempoRespostaDesvioPadraoMs: 50 })
    const b = lerSessao({ acertos: 1, erros: 1, tempoRespostaMedioMs: 800, tempoRespostaDesvioPadraoMs: 150 })
    const r = agregar([a, b])
    expect(r.tempoMedioMs).toBeCloseTo((400 * 4 + 800 * 2) / 6)
    expect(r.desvioMs).toBeCloseTo(100)
    expect(r.precisaoPx).toBeNull()
  })

  it('lida com lista vazia', () => {
    expect(agregar([]).taxaAcerto).toBeNull()
  })
})

describe('interpretar', () => {
  const com = (taxaAcerto, extra = {}) => ({ taxaAcerto, tempoMedioMs: null, desvioMs: null, ...extra })

  it('classifica pela taxa de acerto', () => {
    expect(interpretar(com(0.9)).nivel).toBe('adequado')
    expect(interpretar(com(0.6)).nivel).toBe('atencao')
    expect(interpretar(com(0.2)).nivel).toBe('reduzido')
    expect(interpretar(com(null)).nivel).toBe('sem-dados')
  })

  it('sinaliza alta variabilidade do tempo de resposta', () => {
    const r = interpretar(com(0.9, { tempoMedioMs: 500, desvioMs: 400 }))
    expect(r.observacoes).toHaveLength(1)
  })
})

describe('codificarResumo / decodificarResumo', () => {
  it('faz ida e volta com um jogo só', () => {
    const grupos = [{ jogo: 'jogo-ritmo', resumo: agregar([lerSessao(sessaoBase)]) }]
    const texto = codificarResumo(grupos, '2026-09-21T15:00:00.000Z')
    expect(texto).toMatch(/^[A-Za-z0-9_-]+$/)
    const volta = decodificarResumo(texto)
    expect(volta.dataIso).toBe('2026-09-21T15:00:00.000Z')
    expect(volta.grupos).toHaveLength(1)
    expect(volta.grupos[0].jogo).toBe('jogo-ritmo')
    expect(volta.grupos[0].resumo.acertos).toBe(6)
    expect(volta.grupos[0].resumo.taxaAcerto).toBeCloseTo(0.75)
    expect(volta.grupos[0].resumo.tempoMedioMs).toBeCloseTo(500)
    expect(volta.grupos[0].resumo.fixacaoPx).toBeCloseTo(6)
  })

  it('faz ida e volta com vários jogos', () => {
    const grupos = [
      { jogo: 'jogo-ritmo', resumo: agregar([lerSessao(sessaoBase)]) },
      { jogo: 'outro-jogo', resumo: agregar([lerSessao(sessaoBase), lerSessao(sessaoBase)]) },
    ]
    const volta = decodificarResumo(codificarResumo(grupos, '2026-09-21T15:00:00.000Z'))
    expect(volta.grupos.map((g) => g.jogo)).toEqual(['jogo-ritmo', 'outro-jogo'])
    expect(volta.grupos[1].resumo.sessoes).toBe(2)
  })

  it('devolve null para texto inválido', () => {
    expect(decodificarResumo('isto-nao-e-valido')).toBeNull()
    expect(decodificarResumo('')).toBeNull()
  })
})

describe('resumoPadrao / ehPadrao', () => {
  it('produz um resumo com sessoes: 0 e taxaAcerto derivada', () => {
    const r = resumoPadrao('jogo-ritmo')
    expect(r.sessoes).toBe(0)
    expect(ehPadrao(r)).toBe(true)
    expect(r.taxaAcerto).toBeCloseTo(r.acertos / (r.acertos + r.erros))
  })

  it('cai no padrão genérico para um jogo desconhecido', () => {
    const r = resumoPadrao('jogo-futuro')
    expect(ehPadrao(r)).toBe(true)
    expect(r.acertos).toBe(PADRAO_GENERICO.acertos)
  })

  it('um resumo medido não é padrão', () => {
    expect(ehPadrao(agregar([lerSessao(sessaoBase)]))).toBe(false)
  })
})

describe('montarGrupos', () => {
  it('usa a sessão medida quando existe e o padrão quando falta', () => {
    const medida = lerSessao({ ...sessaoBase, jogo: 'jogo-ritmo' })
    const grupos = montarGrupos([medida], ['jogo-ritmo', 'jogo-futuro'])
    expect(grupos.map((g) => g.jogo)).toEqual(['jogo-ritmo', 'jogo-futuro'])
    expect(ehPadrao(grupos[0].resumo)).toBe(false)
    expect(grupos[0].resumo.acertos).toBe(6)
    expect(ehPadrao(grupos[1].resumo)).toBe(true)
  })

  it('sem nenhuma sessão, todos os jogos esperados saem com padrão', () => {
    const grupos = montarGrupos([], ['jogo-ritmo'])
    expect(grupos).toHaveLength(1)
    expect(ehPadrao(grupos[0].resumo)).toBe(true)
  })

  it('inclui no fim sessões de jogos fora da lista esperada', () => {
    const medida = lerSessao({ ...sessaoBase, jogo: 'jogo-extra' })
    const grupos = montarGrupos([medida], ['jogo-ritmo'])
    expect(grupos.map((g) => g.jogo)).toEqual(['jogo-ritmo', 'jogo-extra'])
    expect(ehPadrao(grupos[0].resumo)).toBe(true)
    expect(ehPadrao(grupos[1].resumo)).toBe(false)
  })
})
