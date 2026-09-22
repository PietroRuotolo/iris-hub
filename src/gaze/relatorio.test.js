import { beforeEach, describe, expect, it, vi } from 'vitest'

function instalarLocalStorage() {
  const dados = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => dados.set(k, String(v)),
    removeItem: (k) => dados.delete(k),
  })
}

function execucao(rotulo, alvos) {
  return {
    rotulo,
    dataHora: '2026-01-01T00:00:00',
    oculos: false,
    iluminacao: 'natural',
    tela: { larguraPx: 1920, alturaPx: 1080 },
    mapeamento: { erroCalibracaoPx: 12 },
    alvos,
  }
}

describe('resumirPorCondicao', () => {
  let relatorio

  beforeEach(async () => {
    vi.resetModules()
    instalarLocalStorage()
    relatorio = await import('./relatorio')
  })

  it('agrupa por condição e região, incluindo "todas"', () => {
    const exec = execucao('c1', [
      { regiao: 'centro', erroPx: 40, dispersaoPx: 10 },
      { regiao: 'centro', erroPx: 60, dispersaoPx: 20 },
      { regiao: 'cantos', erroPx: 200, dispersaoPx: 30 },
      { regiao: 'cantos', dispersaoPx: 0 }, // sem erroPx: alvo inválido, deve ser ignorado
    ])
    const linhas = relatorio.resumirPorCondicao([exec])
    const porChave = Object.fromEntries(linhas.map((l) => [`${l.rotulo}/${l.regiao}`, l]))

    expect(porChave['c1/centro'].n).toBe(2)
    expect(porChave['c1/centro'].erroMedioPx).toBeCloseTo(50)
    expect(porChave['c1/cantos'].n).toBe(1)
    expect(porChave['c1/todas'].n).toBe(3)
  })

  it('gera markdown com a tabela e a lista de execuções', () => {
    const exec = execucao('c1', [{ regiao: 'centro', erroPx: 40, dispersaoPx: 10 }])
    const texto = relatorio.formatarRelatorioMarkdown([exec])
    expect(texto).toContain('| c1 | centro | 1 |')
    expect(texto).toContain('Execuções incluídas:')
    expect(texto).toContain('`c1`')
  })
})

describe('histórico em localStorage', () => {
  let relatorio

  beforeEach(async () => {
    vi.resetModules()
    instalarLocalStorage()
    relatorio = await import('./relatorio')
  })

  it('começa vazio, salva e limpa', () => {
    expect(relatorio.obterHistorico()).toEqual([])
    relatorio.salvarExecucao(execucao('c1', []))
    expect(relatorio.obterHistorico()).toHaveLength(1)
    relatorio.limparHistorico()
    expect(relatorio.obterHistorico()).toEqual([])
  })
})
