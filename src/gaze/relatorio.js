// Agregação dos resultados da Fase 0 em tabelas, e histórico de execuções em localStorage.
// Porta de fase0/analyze.py (protótipo Python) para o navegador.

import { media } from './linalg'

const CHAVE_HISTORICO = 'iris-hub:fase0-execucoes'
const REGIOES_ORDEM = ['centro', 'bordas', 'cantos']

export function obterHistorico() {
  try {
    const texto = localStorage.getItem(CHAVE_HISTORICO)
    return texto ? JSON.parse(texto) : []
  } catch {
    return []
  }
}

export function salvarExecucao(execucao) {
  const historico = [...obterHistorico(), execucao]
  try {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico))
  } catch {
    // sem armazenamento, a execução só fica na tela desta sessão
  }
  return historico
}

export function limparHistorico() {
  try {
    localStorage.removeItem(CHAVE_HISTORICO)
  } catch {
    // ignora
  }
}

function percentil90(valores) {
  const ordenados = [...valores].sort((a, b) => a - b)
  const idx = Math.min(ordenados.length - 1, Math.ceil(0.9 * ordenados.length) - 1)
  return ordenados[idx]
}

/** Agrupa os alvos válidos (com erroPx) de várias execuções por rótulo e região. */
export function agruparPorCondicao(execucoes) {
  const grupos = {}
  for (const execucao of execucoes) {
    const rotulo = execucao.rotulo
    grupos[rotulo] ??= {}
    for (const alvo of execucao.alvos) {
      if (alvo.erroPx === undefined) continue
      grupos[rotulo][alvo.regiao] ??= []
      grupos[rotulo][alvo.regiao].push(alvo)
    }
  }
  return grupos
}

/** Linhas por condição x região (+ "todas"), como o console/tabela do analyze.py. */
export function resumirPorCondicao(execucoes) {
  const grupos = agruparPorCondicao(execucoes)
  const linhas = []

  for (const rotulo of Object.keys(grupos).sort()) {
    const porRegiao = grupos[rotulo]
    const regioes = [
      ...REGIOES_ORDEM.filter((r) => porRegiao[r]),
      ...Object.keys(porRegiao)
        .filter((r) => !REGIOES_ORDEM.includes(r))
        .sort(),
    ]
    for (const regiao of [...regioes, 'todas']) {
      const alvos = regiao === 'todas' ? Object.values(porRegiao).flat() : porRegiao[regiao]
      if (!alvos || alvos.length === 0) continue
      const erros = alvos.map((a) => a.erroPx)
      const comCm = alvos.filter((a) => a.erroCm !== undefined).map((a) => a.erroCm)
      const comGraus = alvos.filter((a) => a.erroGraus !== undefined).map((a) => a.erroGraus)
      const dispersoes = alvos.map((a) => a.dispersaoPx)
      linhas.push({
        rotulo,
        regiao,
        n: alvos.length,
        erroMedioPx: media(erros),
        erroP90Px: percentil90(erros),
        erroCm: comCm.length > 0 ? media(comCm) : null,
        erroGraus: comGraus.length > 0 ? media(comGraus) : null,
        dispersaoPx: media(dispersoes),
      })
    }
  }
  return linhas
}

const fmt = (v, casas = 0) => (v === null || v === undefined ? '—' : v.toFixed(casas))

/** Relatório curto em Markdown, pronto para colar no README/relatório da Fase 0. */
export function formatarRelatorioMarkdown(execucoes) {
  const linhas = resumirPorCondicao(execucoes)
  const cabecalho = [
    '| Condição | Região | Alvos | Erro médio (px) | P90 (px) | Erro (cm) | Erro (°) | Dispersão (px) |',
    '|---|---|---:|---:|---:|---:|---:|---:|',
  ]
  const corpo = linhas.map(
    (l) =>
      `| ${l.rotulo} | ${l.regiao} | ${l.n} | ${fmt(l.erroMedioPx)} | ${fmt(l.erroP90Px)} | ${fmt(l.erroCm, 1)} | ${fmt(l.erroGraus, 1)} | ${fmt(l.dispersaoPx)} |`,
  )
  const execucoesTexto = execucoes.map(
    (e) =>
      `- \`${e.rotulo}\` — ${e.dataHora}, óculos: ${e.oculos ? 'sim' : 'não'}, iluminação: ${e.iluminacao}, ` +
      `tela ${e.tela.larguraPx}x${e.tela.alturaPx}px, erro na calibração: ${fmt(e.mapeamento.erroCalibracaoPx)}px`,
  )
  return [...cabecalho, ...corpo, '', 'Execuções incluídas:', ...execucoesTexto].join('\n')
}
