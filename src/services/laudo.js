// Lógica pura da experiência de demonstração: leitura das sessões do jogo,
// agregação, interpretação (simulada) e codificação do resumo para o QR code.

const ehNumero = (v) => typeof v === 'number' && Number.isFinite(v)
const numeroOuNulo = (v) => (ehNumero(v) ? v : null)

/**
 * Valida e normaliza o JSON exportado pelo jogo de ritmo.
 * Campos obrigatórios: acertos e erros. O restante é opcional.
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

// ---- Codificação do resumo no link do QR code (sem servidor de dados) ----

const arredondar = (v) => (v === null ? null : Math.round(v * 10) / 10)

export function codificarResumo(resumo, dataIso) {
  const compacto = {
    v: 1,
    t: dataIso,
    s: resumo.sessoes,
    a: resumo.acertos,
    e: resumo.erros,
    m: arredondar(resumo.tempoMedioMs),
    d: arredondar(resumo.desvioMs),
    p: arredondar(resumo.precisaoPx),
    f: arredondar(resumo.fixacaoPx),
  }
  return btoa(JSON.stringify(compacto)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/** Inverso de codificarResumo. Retorna { resumo, dataIso } ou null se o texto for inválido. */
export function decodificarResumo(texto) {
  try {
    const base64 = texto.replaceAll('-', '+').replaceAll('_', '/')
    const c = JSON.parse(atob(base64))
    if (c.v !== 1 || !ehNumero(c.a) || !ehNumero(c.e) || !ehNumero(c.s)) return null
    const total = c.a + c.e
    return {
      dataIso: typeof c.t === 'string' ? c.t : null,
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
  } catch {
    return null
  }
}
