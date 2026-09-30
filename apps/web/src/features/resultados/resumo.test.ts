import { describe, expect, it } from 'vitest'
import type { FaseResumo, SessaoJogo } from '@iris/contracts'
import { COBERTURA_MINIMA, formatarData, resumoDaSessao, secaoDaSessao } from './resumo'

const fase = (extra: Partial<FaseResumo> = {}): FaseResumo => ({
  fase: 1,
  nome: 'Familiarização',
  alvosApresentados: 10,
  acertos: 8,
  semResposta: 2,
  rastreamentoInsuficiente: 0,
  pontuacao: 80,
  coberturaRastreamento: 0.95,
  ...extra,
})

const sessao = (extra: Partial<SessaoJogo> = {}): SessaoJogo => ({
  id: 'abc',
  participanteId: 'usuario-1',
  iniciadaEm: '2026-09-26T17:00:00.000Z',
  concluidaEm: '2026-09-26T17:10:00.000Z',
  status: 'CONCLUIDA',
  tela: { larguraPx: 1920, alturaPx: 1080, polegadas: 24, pxPorCm: 36 },
  calibracao: {
    pontos: 9,
    erroMedioPx: 80.4,
    qualidade: 0.82,
    coberturaValida: 0.95,
    distanciaMediaCm: 55,
    oculos: false,
    fracaoReflexo: 0.1,
    reflexoIgnorado: false,
  },
  fases: [fase()],
  pontuacaoTotal: 80,
  coberturaTotal: 0.95,
  versaoPontuacao: 'v1',
  ...extra,
})

const valorDe = (linhas: [string, string][], rotulo: string) => linhas.find(([r]) => r === rotulo)?.[1]

describe('secaoDaSessao', () => {
  it('soma os números das fases e monta as linhas', () => {
    const secao = secaoDaSessao(sessao({ fases: [fase(), fase({ fase: 2, acertos: 6, semResposta: 4, pontuacao: 60 })] }))
    expect(valorDe(secao.linhas, 'Alvos apresentados')).toBe('20')
    expect(valorDe(secao.linhas, 'Acertos')).toBe('14')
    expect(valorDe(secao.linhas, 'Sem resposta')).toBe('6')
    expect(valorDe(secao.linhas, 'Fases jogadas')).toBe('2 de 5')
    expect(valorDe(secao.linhas, 'Taxa de acerto')).toBe('70%')
    expect(secao.valoresDeReferencia).toBe(false)
  })

  it('não conta os alvos descartados na taxa de acerto', () => {
    // 10 alvos, 2 descartados: 6 acertos em 8 válidos = 75%
    const secao = secaoDaSessao(sessao({ fases: [fase({ acertos: 6, semResposta: 2, rastreamentoInsuficiente: 2 })] }))
    expect(valorDe(secao.linhas, 'Taxa de acerto')).toBe('75%')
    expect(secao.leitura.observacoes).toContainEqual(expect.stringContaining('2 alvos foram descartados'))
  })

  it('concorda em número ao avisar sobre um único alvo descartado', () => {
    const secao = secaoDaSessao(sessao({ fases: [fase({ acertos: 7, semResposta: 2, rastreamentoInsuficiente: 1 })] }))
    expect(secao.leitura.observacoes).toContainEqual('1 alvo foi descartado por rastreamento insuficiente e não conta como erro.')
  })

  it('omite as linhas sem valor medido', () => {
    const secao = secaoDaSessao(sessao({ calibracao: null, coberturaTotal: null, pontuacaoTotal: null, fases: [] }))
    const rotulos = secao.linhas.map(([r]) => r)
    expect(rotulos).not.toContain('Qualidade da calibração')
    expect(rotulos).not.toContain('Erro médio da calibração')
    expect(rotulos).not.toContain('Tempo com o olhar rastreado')
    expect(rotulos).not.toContain('Pontuação geral')
    expect(rotulos).toContain('Fases jogadas')
  })

  it('formata a calibração em % e px', () => {
    const secao = secaoDaSessao(sessao())
    expect(valorDe(secao.linhas, 'Qualidade da calibração')).toBe('82%')
    expect(valorDe(secao.linhas, 'Erro médio da calibração')).toBe('80 px')
    expect(valorDe(secao.linhas, 'Pontuação geral')).toBe('80 / 100')
  })
})

describe('leitura', () => {
  it('classifica pela pontuação geral', () => {
    expect(secaoDaSessao(sessao({ pontuacaoTotal: 85 })).leitura.nivel).toBe('adequado')
    expect(secaoDaSessao(sessao({ pontuacaoTotal: 55 })).leitura.nivel).toBe('atencao')
    expect(secaoDaSessao(sessao({ pontuacaoTotal: 20 })).leitura.nivel).toBe('reduzido')
  })

  it('sem fases, não tenta interpretar', () => {
    const leitura = secaoDaSessao(sessao({ fases: [], pontuacaoTotal: null })).leitura
    expect(leitura.nivel).toBe('sem-dados')
  })

  it('avisa quando a partida foi interrompida', () => {
    const leitura = secaoDaSessao(sessao({ status: 'CANCELADA' })).leitura
    expect(leitura.observacoes).toContainEqual(expect.stringContaining('interrompida'))
  })

  it('avisa quando o rastreamento ficou baixo', () => {
    const baixa = secaoDaSessao(sessao({ coberturaTotal: COBERTURA_MINIMA - 0.1 })).leitura
    expect(baixa.observacoes).toContainEqual(expect.stringContaining('fora do rastreamento'))
    const boa = secaoDaSessao(sessao({ coberturaTotal: 0.95 })).leitura
    expect(boa.observacoes).not.toContainEqual(expect.stringContaining('fora do rastreamento'))
  })
})

describe('resumoDaSessao', () => {
  it('usa a data de conclusão e cai na de início quando a sessão não terminou', () => {
    expect(resumoDaSessao(sessao()).data).toBe(formatarData('2026-09-26T17:10:00.000Z'))
    const emAndamento = sessao({ concluidaEm: null, status: 'EM_ANDAMENTO' })
    expect(resumoDaSessao(emAndamento).data).toBe(formatarData('2026-09-26T17:00:00.000Z'))
  })

  it('devolve uma seção por sessão', () => {
    expect(resumoDaSessao(sessao()).secoes).toHaveLength(1)
  })
})

describe('formatarData', () => {
  it('lida com data ausente ou inválida', () => {
    expect(formatarData(null)).toBe('—')
    expect(formatarData('não é data')).toBe('—')
  })
})
