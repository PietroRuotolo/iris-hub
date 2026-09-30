// Monta o resumo mostrado nas telas a partir de uma sessão salva no banco.
// Função pura (sem React, sem fetch): o formato de exibição fica testado à parte das telas.

import {
  resumirCores,
  resumirReflexo,
  type ResumoCompartilhado,
  type SessaoCores,
  type SessaoJogo,
  type SessaoReflexo,
} from '@iris/contracts'
import { classificarTempo } from '../jogo-reflexo/reflexo'

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
  /** Quem jogou (primeiro nome). Sem nome, o cabeçalho diz só "Resultado da experiência". */
  participante?: string | null
  secoes: SecaoResumo[]
}

export const NOME_JOGO_RITMO = 'Jogo de ritmo por rastreamento ocular'
export const NOME_JOGO_REFLEXO = 'Jogo do reflexo'
export const NOME_JOGO_CORES = 'Jogo das cores'

// Faixas da leitura, sobre a pontuação geral (0 a 100). ATENÇÃO: são ilustrativas, para a
// apresentação acadêmica — não têm validade clínica.
export const FAIXAS_LEITURA = { adequado: 70, atencao: 40 }

// Faixa da leitura do jogo das cores, sobre a maior sequência repetida sem erro. ATENÇÃO: ilustrativa,
// como as demais — sem validade clínica.
export const FAIXAS_CORES = { adequado: 6, atencao: 4 }

/** Reflexo: a partir de quantas largadas queimadas (em fração das rodadas) vale um aviso. */
export const FRACAO_QUEIMADAS_AVISO = 1 / 3
/** Reflexo: com menos reações válidas que isso, a média pouco representa a pessoa. */
export const MIN_REACOES_CONFIAVEIS = 3

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

const NIVEL_DA_FAIXA = { excelente: 'adequado', bom: 'adequado', regular: 'atencao', lento: 'reduzido' } as const

/** Uma seção com os números de uma sessão do jogo de reflexo. */
export function secaoDoReflexo(sessao: SessaoReflexo): SecaoResumo {
  const { validas, queimadas, tempoMedioMs, melhorTempoMs } = resumirReflexo(sessao.tentativas)
  const total = sessao.tentativas.length

  const observacoes: string[] = []
  if (sessao.status === 'CANCELADA') observacoes.push('Sessão interrompida: só as rodadas jogadas entram nos números.')
  if (total > 0 && queimadas / total >= FRACAO_QUEIMADAS_AVISO) {
    observacoes.push('Muitas largadas queimadas: a pessoa apertou antes do sinal em boa parte das rodadas.')
  }
  if (validas > 0 && validas < MIN_REACOES_CONFIAVEIS) {
    observacoes.push('Poucas reações válidas: a média representa pouco. Vale jogar mais rodadas.')
  }

  const linhas: [rotulo: string, valor: string | null][] = [
    ['Rodadas jogadas', String(total)],
    ['Reações válidas', String(validas)],
    ['Largadas queimadas', String(queimadas)],
    ['Tempo de reação médio', tempoMedioMs === null ? null : `${Math.round(tempoMedioMs)} ms`],
    ['Melhor tempo', melhorTempoMs === null ? null : `${melhorTempoMs} ms`],
  ]

  const leitura =
    tempoMedioMs === null
      ? {
          nivel: 'sem-dados' as const,
          titulo: 'Sem dados suficientes',
          texto: 'Nenhuma reação válida foi registrada, então não há tempo de reação para resumir.',
          observacoes,
        }
      : {
          nivel: NIVEL_DA_FAIXA[classificarTempo(tempoMedioMs)] as NivelLeitura,
          titulo: TITULO_DA_FAIXA[classificarTempo(tempoMedioMs)],
          texto: 'O tempo de reação é medido do sinal até o aperto do botão. Mostra o desempenho nesta sessão, não é um diagnóstico.',
          observacoes,
        }

  return {
    jogo: 'jogo-reflexo',
    nomeJogo: NOME_JOGO_REFLEXO,
    valoresDeReferencia: false,
    linhas: linhas.filter((linha): linha is [string, string] => linha[1] !== null),
    leitura,
  }
}

const TITULO_DA_FAIXA = {
  excelente: 'Reflexo excelente',
  bom: 'Reflexo bom',
  regular: 'Reflexo regular',
  lento: 'Reflexo lento',
} as const

/** Uma seção com os números de uma sessão do jogo das cores. */
export function secaoDoCores(sessao: SessaoCores): SecaoResumo {
  const { rodadasJogadas, acertos, maiorSequencia, tempoRespostaMedioMs } = resumirCores(sessao.rodadas)

  const observacoes: string[] = []
  if (sessao.status === 'CANCELADA') observacoes.push('Partida interrompida antes do fim: só as rodadas jogadas entram nos números.')

  const linhas: [rotulo: string, valor: string | null][] = [
    ['Maior sequência repetida', rodadasJogadas === 0 ? null : String(maiorSequencia)],
    ['Rodadas jogadas', String(rodadasJogadas)],
    ['Rodadas acertadas', String(acertos)],
    ['Pontuação final', sessao.pontuacaoFinal === null ? null : String(Math.round(sessao.pontuacaoFinal))],
    ['Tempo de resposta médio', tempoRespostaMedioMs === null ? null : `${Math.round(tempoRespostaMedioMs)} ms`],
  ]

  let leitura: SecaoResumo['leitura']
  if (rodadasJogadas === 0) {
    leitura = { nivel: 'sem-dados', titulo: 'Sem dados suficientes', texto: 'Nenhuma rodada foi jogada nesta partida.', observacoes }
  } else if (maiorSequencia >= FAIXAS_CORES.adequado) {
    leitura = { nivel: 'adequado', titulo: 'Memória de sequência adequada', texto: 'A pessoa repetiu sequências longas sem errar.', observacoes }
  } else if (maiorSequencia >= FAIXAS_CORES.atencao) {
    leitura = { nivel: 'atencao', titulo: 'Atenção recomendada', texto: 'A pessoa repetiu sequências de tamanho médio. Vale jogar de novo e acompanhar a evolução.', observacoes }
  } else {
    leitura = { nivel: 'reduzido', titulo: 'Memória de sequência reduzida', texto: 'O erro veio logo nas primeiras rodadas, com sequências curtas.', observacoes }
  }

  return {
    jogo: 'jogo-cores',
    nomeJogo: NOME_JOGO_CORES,
    valoresDeReferencia: false,
    linhas: linhas.filter((linha): linha is [string, string] => linha[1] !== null),
    leitura,
  }
}

/** Resumo completo de uma sessão de reflexo salva, pronto para <ResumoSessao>. */
export function resumoDoReflexo(sessao: SessaoReflexo): Resumo {
  return { data: formatarData(sessao.concluidaEm ?? sessao.iniciadaEm), secoes: [secaoDoReflexo(sessao)] }
}

/** Resumo completo de uma sessão de cores salva, pronto para <ResumoSessao>. */
export function resumoDoCores(sessao: SessaoCores): Resumo {
  return { data: formatarData(sessao.concluidaEm ?? sessao.iniciadaEm), secoes: [secaoDoCores(sessao)] }
}

/** Seção de um jogo que a pessoa não jogou (ou não encerrou) antes de gerar o resumo. */
export function secaoNaoJogada(jogo: string, nomeJogo: string): SecaoResumo {
  return {
    jogo,
    nomeJogo,
    valoresDeReferencia: false,
    linhas: [],
    leitura: {
      nivel: 'sem-dados',
      titulo: 'Não jogado',
      texto: 'Nenhuma partida encerrada deste jogo quando o resumo foi gerado.',
      observacoes: [],
    },
  }
}

/** O resumo aberto pelo QR code: uma seção por jogo, na ordem do menu, com a partida fixada no link. */
export function resumoCompartilhado(dados: ResumoCompartilhado): Resumo {
  return {
    data: formatarData(dados.criadoEm),
    participante: dados.nome,
    secoes: [
      dados.ritmo ? secaoDaSessao(dados.ritmo) : secaoNaoJogada('jogo-ritmo', NOME_JOGO_RITMO),
      dados.reflexo ? secaoDoReflexo(dados.reflexo) : secaoNaoJogada('jogo-reflexo', NOME_JOGO_REFLEXO),
      dados.cores ? secaoDoCores(dados.cores) : secaoNaoJogada('jogo-cores', NOME_JOGO_CORES),
    ],
  }
}
