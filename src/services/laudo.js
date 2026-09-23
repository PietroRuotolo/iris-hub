// Lógica pura da experiência de demonstração: leitura das sessões dos jogos,
// agregação por jogo, interpretação (simulada) e codificação do resumo para o QR code.
//
// Cada pessoa passa por vários jogos/testes ao longo da experiência; o laudo final
// combina as sessões de cada um separadamente (não faz sentido somar acertos de
// jogos diferentes num único número).

const ehNumero = (v) => typeof v === 'number' && Number.isFinite(v)
const numeroOuNulo = (v) => (ehNumero(v) ? v : null)

// Nomes de exibição dos jogos conhecidos. Um jogo sem entrada aqui ainda funciona:
// `nomeJogo` cai de volta no próprio id.
const NOMES_JOGOS = {
  'jogo-ritmo': 'Jogo de ritmo por rastreamento ocular',
}

export function nomeJogo(id) {
  return NOMES_JOGOS[id] ?? id
}

/**
 * Valida e normaliza o JSON exportado por um jogo.
 * Campos obrigatórios: acertos e erros. O restante é opcional.
 * Sem o campo "jogo", assume "jogo-ritmo" (único jogo que já exporta sessões).
 * Lança Error com mensagem em português quando o arquivo não serve.
 */
export function lerSessao(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('o conteúdo não é um objeto JSON de sessão')
  }
  const { acertos, erros } = json
  if (!ehNumero(acertos) || acertos < 0 || !ehNumero(erros) || erros < 0) {
    throw new Error('faltam os campos numéricos "acertos" e "erros"')
  }

  const detalhe = Array.isArray(json.detalhePorAlvo) ? json.detalhePorAlvo : []

  return {
    id: '',
    jogo: typeof json.jogo === 'string' && json.jogo ? json.jogo : 'jogo-ritmo',
    data: typeof json.data === 'string' ? json.data : null,
    acertos,
    erros,
    tempoRespostaMedioMs: numeroOuNulo(json.tempoRespostaMedioMs),
    tempoRespostaDesvioPadraoMs: numeroOuNulo(json.tempoRespostaDesvioPadraoMs),
    alvos: detalhe.map((a) => ({
      tempoRespostaMs: numeroOuNulo(a?.tempoRespostaMs),
      precisaoPx: numeroOuNulo(a?.precisaoPx),
      variabilidadeFixacaoPx: numeroOuNulo(a?.variabilidadeFixacaoPx),
    })),
  }
}

/** Agrupa as sessões por jogo, preservando a ordem em que cada jogo apareceu primeiro. */
export function agruparPorJogo(sessoes) {
  const ordem = []
  const porJogo = new Map()
  for (const sessao of sessoes) {
    if (!porJogo.has(sessao.jogo)) {
      ordem.push(sessao.jogo)
      porJogo.set(sessao.jogo, [])
    }
    porJogo.get(sessao.jogo).push(sessao)
  }
  return ordem.map((jogo) => ({ jogo, sessoes: porJogo.get(jogo) }))
}

function media(valores) {
  return valores.reduce((soma, v) => soma + v, 0) / valores.length
}

function desvioPadrao(valores) {
  const m = media(valores)
  return Math.sqrt(media(valores.map((v) => (v - m) ** 2)))
}

/** Combina várias sessões em um único resumo. Métricas ausentes ficam como null. */
export function agregar(sessoes) {
  const acertos = sessoes.reduce((soma, s) => soma + s.acertos, 0)
  const erros = sessoes.reduce((soma, s) => soma + s.erros, 0)
  const total = acertos + erros

  const coletar = (campo) =>
    sessoes.flatMap((s) => s.alvos.map((a) => a[campo])).filter(ehNumero)

  const tempos = coletar('tempoRespostaMs')
  let tempoMedioMs = null
  let desvioMs = null
  if (tempos.length > 0) {
    tempoMedioMs = media(tempos)
    desvioMs = desvioPadrao(tempos)
  } else {
    // Sem detalhe por alvo: usa as estatísticas que cada sessão já trouxe.
    const comMedia = sessoes.filter((s) => s.tempoRespostaMedioMs !== null)
    const peso = comMedia.reduce((soma, s) => soma + s.acertos + s.erros, 0)
    if (comMedia.length > 0 && peso > 0) {
      tempoMedioMs = comMedia.reduce((soma, s) => soma + s.tempoRespostaMedioMs * (s.acertos + s.erros), 0) / peso
    }
    const desvios = sessoes.map((s) => s.tempoRespostaDesvioPadraoMs).filter(ehNumero)
    if (desvios.length > 0) desvioMs = media(desvios)
  }

  const precisoes = coletar('precisaoPx')
  const fixacoes = coletar('variabilidadeFixacaoPx')

  return {
    sessoes: sessoes.length,
    acertos,
    erros,
    taxaAcerto: total > 0 ? acertos / total : null,
    tempoMedioMs,
    desvioMs,
    precisaoPx: precisoes.length > 0 ? media(precisoes) : null,
    fixacaoPx: fixacoes.length > 0 ? media(fixacoes) : null,
  }
}

// ---- Valores padrão (jogo que a pessoa não chegou a jogar) ----

// A experiência é demonstrada em feira/apresentação: nem sempre dá tempo de a
// pessoa passar por todos os jogos, mas o laudo e o QR code precisam sair mesmo
// assim. Quando falta um jogo, o laudo usa estes valores de referência.
// AJUSTE OS NÚMEROS AQUI: são ilustrativos, como todo o resto do laudo simulado.
export const PADROES_POR_JOGO = {
  'jogo-ritmo': { acertos: 7, erros: 3, tempoMedioMs: 620, desvioMs: 180, precisaoPx: 34, fixacaoPx: 7.5 },
}

// Usado por um jogo que ainda não tem padrão próprio (nome final indefinido, etc.).
export const PADRAO_GENERICO = { acertos: 6, erros: 4, tempoMedioMs: 700, desvioMs: 210, precisaoPx: 40, fixacaoPx: 9 }

/**
 * Resumo de referência de um jogo não realizado, no mesmo formato de `agregar`.
 * `sessoes: 0` é o que marca o resumo como padrão (ver `ehPadrao`): um resumo
 * medido sempre vem de pelo menos uma sessão.
 */
export function resumoPadrao(jogo) {
  const padrao = PADROES_POR_JOGO[jogo] ?? PADRAO_GENERICO
  const total = padrao.acertos + padrao.erros
  return {
    sessoes: 0,
    acertos: padrao.acertos,
    erros: padrao.erros,
    taxaAcerto: total > 0 ? padrao.acertos / total : null,
    tempoMedioMs: padrao.tempoMedioMs,
    desvioMs: padrao.desvioMs,
    precisaoPx: padrao.precisaoPx,
    fixacaoPx: padrao.fixacaoPx,
  }
}

/** Distingue um resumo de referência de um resumo medido. Ver `resumoPadrao`. */
export const ehPadrao = (resumo) => resumo.sessoes === 0

/**
 * Monta o laudo inteiro: um grupo por jogo esperado, na ordem da experiência,
 * com as sessões medidas quando existem e os valores padrão quando não existem.
 * Sessões de jogos fora da lista esperada entram no fim, para nenhum dado
 * carregado ser descartado silenciosamente.
 */
export function montarGrupos(sessoes, jogosEsperados = []) {
  const medidas = new Map(agruparPorJogo(sessoes).map((g) => [g.jogo, g.sessoes]))

  const grupos = jogosEsperados.map((jogo) => {
    const doJogo = medidas.get(jogo)
    medidas.delete(jogo)
    return { jogo, resumo: doJogo ? agregar(doJogo) : resumoPadrao(jogo) }
  })

  for (const [jogo, doJogo] of medidas) {
    grupos.push({ jogo, resumo: agregar(doJogo) })
  }
  return grupos
}

// ATENÇÃO: limites ilustrativos, apenas para o laudo SIMULADO da apresentação.
// Não têm validade clínica.
export const LIMITES_DEMO = { adequado: 0.8, atencao: 0.5, variabilidadeAlta: 0.5 }

/** Interpretação simulada do resumo. Retorna { nivel, titulo, texto, observacoes }. */
export function interpretar(resumo) {
  if (resumo.taxaAcerto === null) {
    return { nivel: 'sem-dados', titulo: 'Sem dados suficientes', texto: 'Nenhum alvo foi registrado nas sessões.', observacoes: [] }
  }

  const observacoes = []
  if (resumo.tempoMedioMs && resumo.desvioMs && resumo.desvioMs / resumo.tempoMedioMs > LIMITES_DEMO.variabilidadeAlta) {
    observacoes.push('Alta variabilidade no tempo de resposta entre os alvos.')
  }

  if (resumo.taxaAcerto >= LIMITES_DEMO.adequado) {
    return { nivel: 'adequado', titulo: 'Desempenho adequado', texto: 'A pessoa acompanhou a maioria dos alvos com o olhar dentro do tempo previsto.', observacoes }
  }
  if (resumo.taxaAcerto >= LIMITES_DEMO.atencao) {
    return { nivel: 'atencao', titulo: 'Atenção recomendada', texto: 'Parte dos alvos não foi acompanhada no tempo previsto. Sugere-se repetir o teste e acompanhar a evolução.', observacoes }
  }
  return { nivel: 'reduzido', titulo: 'Desempenho reduzido', texto: 'A maior parte dos alvos não foi acompanhada no tempo previsto. Sugere-se avaliação com profissional de saúde.', observacoes }
}

// ---- Codificação do laudo no link do QR code (sem servidor de dados) ----

const arredondar = (v) => (v === null ? null : Math.round(v * 10) / 10)

function codificarGrupo({ jogo, resumo }) {
  return {
    j: jogo,
    s: resumo.sessoes,
    a: resumo.acertos,
    e: resumo.erros,
    m: arredondar(resumo.tempoMedioMs),
    d: arredondar(resumo.desvioMs),
    p: arredondar(resumo.precisaoPx),
    f: arredondar(resumo.fixacaoPx),
  }
}

function decodificarGrupo(c) {
  if (!ehNumero(c.a) || !ehNumero(c.e) || !ehNumero(c.s)) return null
  const total = c.a + c.e
  return {
    jogo: typeof c.j === 'string' ? c.j : 'jogo-ritmo',
    resumo: {
      sessoes: c.s,
      acertos: c.a,
      erros: c.e,
      taxaAcerto: total > 0 ? c.a / total : null,
      tempoMedioMs: numeroOuNulo(c.m),
      desvioMs: numeroOuNulo(c.d),
      precisaoPx: numeroOuNulo(c.p),
      fixacaoPx: numeroOuNulo(c.f),
    },
  }
}

/** Codifica o laudo (um resumo por jogo) no link do QR code. */
export function codificarResumo(grupos, dataIso) {
  const compacto = { v: 2, t: dataIso, g: grupos.map(codificarGrupo) }
  return btoa(JSON.stringify(compacto)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/** Inverso de codificarResumo. Retorna { grupos, dataIso } ou null se o texto for inválido. */
export function decodificarResumo(texto) {
  try {
    const base64 = texto.replaceAll('-', '+').replaceAll('_', '/')
    const c = JSON.parse(atob(base64))
    if (c.v !== 2 || !Array.isArray(c.g)) return null
    const grupos = c.g.map(decodificarGrupo)
    if (grupos.some((g) => g === null)) return null
    return { dataIso: typeof c.t === 'string' ? c.t : null, grupos }
  } catch {
    return null
  }
}
