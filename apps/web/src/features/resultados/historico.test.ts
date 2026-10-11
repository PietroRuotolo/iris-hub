import { describe, expect, it } from 'vitest'
import type { SessaoCores, SessaoJogo, SessaoReflexo } from '@iris/contracts'
import { caminhoDoResumo, itemDoCores, itemDoReflexo, itemDoRitmo, jogoDaUrl, ordenarHistorico } from './historico'
import { resumoDoCores, resumoDoReflexo, secaoDoCores, secaoDoReflexo } from './resumo'

const reflexo = (extra: Partial<SessaoReflexo> = {}): SessaoReflexo => ({
  id: 'r1',
  participanteId: 'u',
  iniciadaEm: '2026-09-29T10:00:00.000Z',
  concluidaEm: '2026-09-29T10:05:00.000Z',
  status: 'CONCLUIDA',
  tempoMedioMs: 250,
  melhorTempoMs: 200,
  tentativas: [
    { rodada: 1, tempoEsperaMs: 3000, tempoReacaoMs: 300, queimou: false, acionamento: 'ESP32_BUTTON' },
    { rodada: 2, tempoEsperaMs: 2500, tempoReacaoMs: 200, queimou: false, acionamento: 'ESP32_BUTTON' },
    { rodada: 3, tempoEsperaMs: 2000, tempoReacaoMs: 250, queimou: false, acionamento: 'ESP32_BUTTON' },
    { rodada: 4, tempoEsperaMs: 1000, tempoReacaoMs: null, queimou: true, acionamento: 'ESP32_BUTTON' },
  ],
  ...extra,
})

/** Reflexo em que as 3 reações válidas levam exatamente `ms` (o resumo é recalculado a partir das tentativas). */
const comReacao = (ms: number) =>
  reflexo({
    tentativas: [1, 2, 3].map((n) => ({ rodada: n, tempoEsperaMs: 2000, tempoReacaoMs: ms, queimou: false, acionamento: 'ESP32_BUTTON' as const })),
  })

const cores = (extra: Partial<SessaoCores> = {}): SessaoCores => ({
  id: 'c1',
  participanteId: 'u',
  iniciadaEm: '2026-09-29T11:00:00.000Z',
  concluidaEm: '2026-09-29T11:03:00.000Z',
  status: 'CONCLUIDA',
  pontuacaoFinal: 6,
  maiorSequencia: 6,
  tempoRespostaMedioMs: 2100,
  rodadas: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ rodada: n, tamanhoSequencia: n, acertou: n <= 6, tempoRespostaMs: 2100 })),
  ...extra,
})

const valorDe = (linhas: [string, string][], rotulo: string) => linhas.find(([r]) => r === rotulo)?.[1]

describe('secaoDoReflexo', () => {
  it('mostra rodadas, reações válidas, queimadas e tempos', () => {
    const secao = secaoDoReflexo(reflexo())
    expect(valorDe(secao.linhas, 'Rodadas jogadas')).toBe('4')
    expect(valorDe(secao.linhas, 'Reações válidas')).toBe('3')
    expect(valorDe(secao.linhas, 'Largadas queimadas')).toBe('1')
    expect(valorDe(secao.linhas, 'Tempo de reação médio')).toBe('250 ms')
    expect(valorDe(secao.linhas, 'Melhor tempo')).toBe('200 ms')
    expect(secao.valoresDeReferencia).toBe(false)
  })

  it('classifica pelo tempo médio', () => {
    expect(secaoDoReflexo(comReacao(150)).leitura.nivel).toBe('adequado')
    expect(secaoDoReflexo(comReacao(300)).leitura.nivel).toBe('adequado')
    expect(secaoDoReflexo(comReacao(400)).leitura.nivel).toBe('atencao')
    expect(secaoDoReflexo(comReacao(600)).leitura.nivel).toBe('reduzido')
  })

  it('sem reação válida, não interpreta e omite as linhas de tempo', () => {
    const secao = secaoDoReflexo(reflexo({ tempoMedioMs: null, melhorTempoMs: null, tentativas: [] }))
    expect(secao.leitura.nivel).toBe('sem-dados')
    expect(secao.linhas.map(([r]) => r)).not.toContain('Tempo de reação médio')
  })

  it('avisa de partida interrompida, de muitas queimadas e de poucas reações', () => {
    const queimadas = [1, 2, 3].map((n) => ({ rodada: n, tempoEsperaMs: 500, tempoReacaoMs: null, queimou: true, acionamento: 'ESP32_BUTTON' as const }))
    const obs = secaoDoReflexo(reflexo({ status: 'CANCELADA', tentativas: [...queimadas, reflexo().tentativas[0]] })).leitura.observacoes
    expect(obs).toContainEqual(expect.stringContaining('interrompida'))
    expect(obs).toContainEqual(expect.stringContaining('largadas queimadas'))
    expect(obs).toContainEqual(expect.stringContaining('Poucas reações'))
  })
})

describe('secaoDoCores', () => {
  it('mostra a maior sequência, rodadas, pontuação e tempo', () => {
    const secao = secaoDoCores(cores())
    expect(valorDe(secao.linhas, 'Maior sequência repetida')).toBe('6')
    expect(valorDe(secao.linhas, 'Rodadas jogadas')).toBe('7')
    expect(valorDe(secao.linhas, 'Rodadas acertadas')).toBe('6')
    expect(valorDe(secao.linhas, 'Pontuação final')).toBe('6')
    expect(valorDe(secao.linhas, 'Tempo de resposta médio')).toBe('2100 ms')
  })

  it('classifica pela maior sequência', () => {
    const com = (n: number) => cores({ rodadas: Array.from({ length: n + 1 }, (_, i) => ({ rodada: i + 1, tamanhoSequencia: i + 1, acertou: i < n, tempoRespostaMs: 1000 })) })
    expect(secaoDoCores(com(7)).leitura.nivel).toBe('adequado')
    expect(secaoDoCores(com(4)).leitura.nivel).toBe('atencao')
    expect(secaoDoCores(com(2)).leitura.nivel).toBe('reduzido')
  })

  it('errar na primeira rodada dá sequência 0, ainda com dados', () => {
    const secao = secaoDoCores(cores({ rodadas: [{ rodada: 1, tamanhoSequencia: 1, acertou: false, tempoRespostaMs: 900 }], pontuacaoFinal: 0 }))
    expect(valorDe(secao.linhas, 'Maior sequência repetida')).toBe('0')
    expect(secao.leitura.nivel).toBe('reduzido')
  })

  it('sem rodadas, não interpreta e omite a maior sequência', () => {
    const secao = secaoDoCores(cores({ rodadas: [], pontuacaoFinal: null, maiorSequencia: null, tempoRespostaMedioMs: null, status: 'CANCELADA' }))
    expect(secao.leitura.nivel).toBe('sem-dados')
    expect(secao.linhas.map(([r]) => r)).not.toContain('Maior sequência repetida')
    expect(secao.leitura.observacoes).toContainEqual(expect.stringContaining('interrompida'))
  })
})

describe('resumos completos', () => {
  it('cada jogo devolve uma seção com o nome certo', () => {
    expect(resumoDoReflexo(reflexo()).secoes[0].nomeJogo).toBe('Jogo do reflexo')
    expect(resumoDoCores(cores()).secoes[0].nomeJogo).toBe('Jogo das cores')
  })
})

describe('histórico unificado', () => {
  const ritmo: SessaoJogo = {
    id: 'j1',
    participanteId: 'u',
    iniciadaEm: '2026-09-29T09:00:00.000Z',
    concluidaEm: '2026-09-29T09:10:00.000Z',
    status: 'CONCLUIDA',
    tela: { larguraPx: 1, alturaPx: 1, polegadas: null, pxPorCm: null },
    calibracao: null,
    fases: [],
    pontuacaoTotal: 63.9,
    coberturaTotal: 0.9,
    versaoPontuacao: 'v1',
  }

  it('resume cada jogo em uma linha', () => {
    expect(itemDoRitmo(ritmo).resumo).toBe('64 / 100 · 0 de 5 fases')
    expect(itemDoReflexo(reflexo()).resumo).toBe('250 ms em média · 4 rodadas')
    expect(itemDoCores(cores()).resumo).toBe('Maior sequência: 6 · 7 rodadas')
  })

  it('concorda em número: "1 rodada", não "1 rodadas"', () => {
    const uma = { rodada: 1, tamanhoSequencia: 1, acertou: true, tempoRespostaMs: 500 }
    expect(itemDoCores(cores({ rodadas: [uma], maiorSequencia: 1 })).resumo).toBe('Maior sequência: 1 · 1 rodada')
    expect(itemDoReflexo(reflexo({ tentativas: [reflexo().tentativas[0]] })).resumo).toContain('· 1 rodada')
    expect(itemDoReflexo(reflexo({ tentativas: [reflexo().tentativas[0]] })).resumo).not.toContain('rodadas')
  })

  it('ordena do mais recente para o mais antigo, sem alterar a lista original', () => {
    const itens = [itemDoRitmo(ritmo), itemDoCores(cores()), itemDoReflexo(reflexo())]
    const ordenados = ordenarHistorico(itens)
    expect(ordenados.map((i) => i.jogo)).toEqual(['cores', 'reflexo', 'ritmo'])
    expect(itens.map((i) => i.jogo)).toEqual(['ritmo', 'cores', 'reflexo'])
  })

  it('sessão não terminada usa a data de início', () => {
    expect(itemDoReflexo(reflexo({ concluidaEm: null, status: 'EM_ANDAMENTO' })).data).toBe('2026-09-29T10:00:00.000Z')
  })

  it('o caminho do resumo leva o jogo, menos para o ritmo (links antigos continuam iguais)', () => {
    expect(caminhoDoResumo({ jogo: 'ritmo', id: 'abc' })).toBe('/sessao/abc/resumo')
    expect(caminhoDoResumo({ jogo: 'reflexo', id: 'abc' })).toBe('/sessao/abc/resumo?jogo=reflexo')
    expect(caminhoDoResumo({ jogo: 'cores', id: 'a b' })).toBe('/sessao/a%20b/resumo?jogo=cores')
  })

  it('só reconhece os jogos conhecidos; o resto cai em ritmo', () => {
    expect(jogoDaUrl('reflexo')).toBe('reflexo')
    expect(jogoDaUrl('cores')).toBe('cores')
    expect(jogoDaUrl(undefined)).toBe('ritmo')
    expect(jogoDaUrl('outro')).toBe('ritmo')
    expect(jogoDaUrl(['cores', 'x'])).toBe('cores')
  })
})
