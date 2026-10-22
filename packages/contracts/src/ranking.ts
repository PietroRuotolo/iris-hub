// Ranking geral dos três jogos: cada jogo vira uma nota de 0 a 100 e a nota geral é a média das três.
// Entra no ranking quem tem ao menos uma partida concluída de cada jogo, e conta a MELHOR de cada um
// (quem treina sobe). Regras puras: o session-service calcula com elas, e os testes ficam aqui.

/** Pontos máximos de uma partida de cada jogo (o ritmo já é de 0 a 100). */
export const PONTOS_MAXIMOS = { ritmo: 100, reflexo: 500, cores: 500 } as const

export type JogoDoRanking = keyof typeof PONTOS_MAXIMOS

const umaCasa = (v: number) => Math.round(v * 10) / 10

/** A nota de 0 a 100 de um jogo, a partir dos pontos de uma partida (uma casa decimal). */
export function notaDoJogo(jogo: JogoDoRanking, pontos: number): number {
  const nota = (pontos / PONTOS_MAXIMOS[jogo]) * 100
  return umaCasa(Math.min(100, Math.max(0, nota)))
}

/** As melhores partidas de um jogador (pontos de cada jogo, na escala do jogo). */
export interface MelhoresDoJogador {
  jogadorId: string
  nome: string
  ritmo: number | null
  reflexo: number | null
  cores: number | null
}

export interface LinhaRankingGeral {
  /** 1, 2, 3...: empate na nota geral divide a posição. */
  posicao: number
  jogadorId: string
  nome: string
  /** Notas de 0 a 100 de cada jogo (a melhor partida concluída de cada um). */
  ritmo: number
  reflexo: number
  cores: number
  /** Média das três notas (0 a 100). */
  geral: number
}

/**
 * O ranking: só quem jogou os 3 jogos, da maior nota geral para a menor. Empate fica em ordem
 * alfabética e com a mesma posição (1, 2, 2, 4).
 */
export function montarRanking(jogadores: MelhoresDoJogador[]): LinhaRankingGeral[] {
  const completos = jogadores.flatMap((j) => {
    if (j.ritmo === null || j.reflexo === null || j.cores === null) return []
    const ritmo = notaDoJogo('ritmo', j.ritmo)
    const reflexo = notaDoJogo('reflexo', j.reflexo)
    const cores = notaDoJogo('cores', j.cores)
    return [{ jogadorId: j.jogadorId, nome: j.nome, ritmo, reflexo, cores, geral: umaCasa((ritmo + reflexo + cores) / 3) }]
  })
  completos.sort((a, b) => b.geral - a.geral || a.nome.localeCompare(b.nome, 'pt-BR'))
  return completos.map((linha, i) => {
    const empatado = completos.findIndex((x) => x.geral === linha.geral)
    return { posicao: (empatado === -1 ? i : empatado) + 1, ...linha }
  })
}