// Monta o resumo mostrado nas telas a partir de uma sessão salva no banco.
// Função pura (sem React, sem fetch): o formato de exibição fica testado à parte das telas.

import type { SessaoJogo } from '@iris/contracts'

export type NivelLeitura = 'adequado' | 'atencao' | 'reduzido' | 'sem-dados'

export interface SecaoResumo {
  jogo: string
  nomeJogo: string
  /** Números ilustrativos, de uma sessão que não aconteceu (só as telas de exemplo usam). */
  valoresDeReferencia: boolean
  linhas: [rotulo: string, valor: string][]
  leitura: { nivel: NivelLeitura; titulo: string; texto: string; observacoes: string[] }
}

export interface Resumo {
  data: string
  secoes: SecaoResumo[]
}

export const NOME_JOGO_RITMO = 'Jogo de ritmo por rastreamento ocular'

// Faixas da leitura, sobre a pontuação geral (0 a 100). ATENÇÃO: são ilustrativas, para a
// apresentação acadêmica — não têm validade clínica.
export const FAIXAS_LEITURA = { adequado: 70, atencao: 40 }

/** Rastreamento abaixo disso vira observação: os números da partida ficam menos confiáveis. */
export const COBERTURA_MINIMA = 0.7

const pct = (v: number | null) => (v === null ? null : `${Math.round(v * 100)}%`)
const somar = (valores: number[]) => valores.reduce((s, v) => s + v, 0)

export function formatarData(iso: string | null): string {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
}

function leituraDe(sessao: SessaoJogo, observacoes: string[]) {
  const pontos = sessao.pontuacaoTotal
  if (pontos === null || sessao.fases.length === 0) {
    return {
      nivel: 'sem-dados' as const,
      titulo: 'Sem dados suficientes',
      texto: 'Nenhuma fase foi concluída nesta partida, então não há o que resumir.',
      observacoes,
    }
  }
  if (pontos >= FAIXAS_LEITURA.adequado) {
    return {
      nivel: 'adequado' as const,
      titulo: 'Desempenho adequado',
      texto: 'O olhar acompanhou a maioria dos alvos dentro do tempo previsto.',
      observacoes,
    }
  }
  if (pontos >= FAIXAS_LEITURA.atencao) {
    return {
      nivel: 'atencao' as const,
      titulo: 'Atenção recomendada',
      texto: 'Parte dos alvos não foi acompanhada no tempo previsto. Vale repetir a partida e acompanhar a evolução.',
      observacoes,
    }
  }
  return {
    nivel: 'reduzido' as const,
    titulo: 'Desempenho reduzido',
    texto: 'A maior parte dos alvos não foi acompanhada no tempo previsto.',
    observacoes,
  }
}

/** Observações sobre a qualidade dos dados: explicam números baixos que não são desempenho. */
function observacoesDe(sessao: SessaoJogo, descartados: number): string[] {
  const observacoes: string[] = []
  if (sessao.status === 'CANCELADA') {
    observacoes.push('Partida interrompida antes do fim: só as fases concluídas entram nos números.')
  }
  if (sessao.coberturaTotal !== null && sessao.coberturaTotal < COBERTURA_MINIMA) {
    observacoes.push('O olhar ficou fora do rastreamento em boa parte da partida, o que reduz a confiança nos números.')
  }
  if (descartados > 0) {
    observacoes.push(
      descartados === 1
        ? '1 alvo foi descartado por rastreamento insuficiente e não conta como erro.'
        : `${descartados} alvos foram descartados por rastreamento insuficiente e não contam como erro.`,
    )
  }
  return observacoes
}

/** Uma seção com os números da sessão. Linhas sem valor medido ficam de fora. */
export function secaoDaSessao(sessao: SessaoJogo): SecaoResumo {
  const apresentados = somar(sessao.fases.map((f) => f.alvosApresentados))
  const acertos = somar(sessao.fases.map((f) => f.acertos))
  const semResposta = somar(sessao.fases.map((f) => f.semResposta))
  const descartados = somar(sessao.fases.map((f) => f.rastreamentoInsuficiente))
  const validos = apresentados - descartados

  const linhas: ([rotulo: string, valor: string | null])[] = [
    ['Pontuação geral', sessao.pontuacaoTotal === null ? null : `${Math.round(sessao.pontuacaoTotal)} / 100`],
    ['Fases jogadas', `${sessao.fases.length} de 5`],
    ['Alvos apresentados', String(apresentados)],
    ['Acertos', String(acertos)],
    ['Sem resposta', String(semResposta)],
    ['Taxa de acerto', validos > 0 ? `${Math.round((acertos / validos) * 100)}%` : null],
    ['Tempo com o olhar rastreado', pct(sessao.coberturaTotal)],
    ['Qualidade da calibração', pct(sessao.calibracao?.qualidade ?? null)],
    [
      'Erro médio da calibração',
      sessao.calibracao?.erroMedioPx == null ? null : `${Math.round(sessao.calibracao.erroMedioPx)} px`,
    ],
  ]

  return {
    jogo: 'jogo-ritmo',
    nomeJogo: NOME_JOGO_RITMO,
    valoresDeReferencia: false,
    linhas: linhas.filter((linha): linha is [string, string] => linha[1] !== null),
    leitura: leituraDe(sessao, observacoesDe(sessao, descartados)),
  }
}

/** Resumo completo de uma sessão salva, pronto para <ResumoSessao>. */
export function resumoDaSessao(sessao: SessaoJogo): Resumo {
  return {
    data: formatarData(sessao.concluidaEm ?? sessao.iniciadaEm),
    secoes: [secaoDaSessao(sessao)],
  }
}
