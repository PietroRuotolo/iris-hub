// Histórico de partidas da pessoa: junta as sessões dos três jogos numa lista só, da mais recente para
// a mais antiga. Função pura (sem React, sem fetch): a tela só busca e mostra.

import type { SessaoCores, SessaoJogo, SessaoReflexo, StatusSessao } from '@iris/contracts'
import { NOME_JOGO_CORES, NOME_JOGO_REFLEXO, NOME_JOGO_RITMO } from './resumo'

/** O valor de `?jogo=` na página do resumo. "ritmo" é o padrão (os links antigos não têm o parâmetro). */
export type JogoHistorico = 'ritmo' | 'reflexo' | 'cores'

export const NOME_DO_JOGO: Record<JogoHistorico, string> = {
  ritmo: NOME_JOGO_RITMO,
  reflexo: NOME_JOGO_REFLEXO,
  cores: NOME_JOGO_CORES,
}

export interface ItemHistorico {
  jogo: JogoHistorico
  id: string
  /** Quando terminou; se não terminou, quando começou (ISO 8601). */
  data: string
  status: StatusSessao
  /** Uma linha com o principal da partida, para a lista. */
  resumo: string
}

/** Só aceita os jogos conhecidos; qualquer outra coisa (ou nada) cai em "ritmo". */
export function jogoDaUrl(valor: string | string[] | undefined): JogoHistorico {
  const v = Array.isArray(valor) ? valor[0] : valor
  return v === 'reflexo' || v === 'cores' ? v : 'ritmo'
}

const rodadas = (n: number) => `${n} ${n === 1 ? 'rodada' : 'rodadas'}`

export function itemDoRitmo(s: SessaoJogo): ItemHistorico {
  const pontos = s.pontuacaoTotal === null ? 'Sem pontuação' : `${Math.round(s.pontuacaoTotal)} / 100`
  return { jogo: 'ritmo', id: s.id, data: s.concluidaEm ?? s.iniciadaEm, status: s.status, resumo: `${pontos} · ${s.fases.length} de 5 fases` }
}

export function itemDoReflexo(s: SessaoReflexo): ItemHistorico {
  const tempo = s.tempoMedioMs === null ? 'Sem tempo válido' : `${Math.round(s.tempoMedioMs)} ms em média`
  return { jogo: 'reflexo', id: s.id, data: s.concluidaEm ?? s.iniciadaEm, status: s.status, resumo: `${tempo} · ${rodadas(s.tentativas.length)}` }
}

export function itemDoCores(s: SessaoCores): ItemHistorico {
  const sequencia = s.maiorSequencia === null ? 'Sem rodadas' : `Maior sequência: ${s.maiorSequencia}`
  return { jogo: 'cores', id: s.id, data: s.concluidaEm ?? s.iniciadaEm, status: s.status, resumo: `${sequencia} · ${rodadas(s.rodadas.length)}` }
}

/** Da mais recente para a mais antiga. Não altera a lista recebida. */
export function ordenarHistorico(itens: ItemHistorico[]): ItemHistorico[] {
  return [...itens].sort((a, b) => Date.parse(b.data) - Date.parse(a.data))
}

/** O caminho do resumo de uma partida. O jogo de ritmo fica sem parâmetro, como sempre foi. */
export function caminhoDoResumo(item: Pick<ItemHistorico, 'jogo' | 'id'>): string {
  const base = `/sessao/${encodeURIComponent(item.id)}/resumo`
  return item.jogo === 'ritmo' ? base : `${base}?jogo=${item.jogo}`
}
