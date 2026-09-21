import { describe, expect, it } from 'vitest'
import { agregar, codificarResumo, decodificarResumo, interpretar, lerSessao } from './laudo'

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

  it('rejeita arquivos sem acertos/erros numéricos', () => {
    expect(() => lerSessao({ acertos: '3', erros: 1 })).toThrow(/acertos/)
    expect(() => lerSessao(null)).toThrow()
    expect(() => lerSessao([])).toThrow()
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
  it('faz ida e volta', () => {
    const resumo = agregar([lerSessao(sessaoBase)])
    const texto = codificarResumo(resumo, '2026-09-21T15:00:00.000Z')
    expect(texto).toMatch(/^[A-Za-z0-9_-]+$/)
    const volta = decodificarResumo(texto)
    expect(volta.dataIso).toBe('2026-09-21T15:00:00.000Z')
    expect(volta.resumo.acertos).toBe(6)
    expect(volta.resumo.taxaAcerto).toBeCloseTo(0.75)
    expect(volta.resumo.tempoMedioMs).toBeCloseTo(500)
    expect(volta.resumo.fixacaoPx).toBeCloseTo(6)
  })

  it('devolve null para texto inválido', () => {
    expect(decodificarResumo('isto-nao-e-valido')).toBeNull()
    expect(decodificarResumo('')).toBeNull()
  })
})
