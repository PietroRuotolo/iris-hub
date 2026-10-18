// Ranking da tela inicial. Por enquanto com dados de exemplo (MOCK_RANKING): a pontuação final ainda
// não é calculada nem gravada (game_results.total_score fica vazio). Quando for, a tela passa a ler de lá.

export interface LinhaRanking {
  nome: string
  pontos: number
}

/** Dados de exemplo, só para a tela. */
export const MOCK_RANKING: LinhaRanking[] = [
  { nome: 'Ana Souza', pontos: 78 },
  { nome: 'João Pedro', pontos: 91.5 },
  { nome: 'Maria Clara', pontos: 64.2 },
  { nome: 'Pedro Henrique', pontos: 85 },
  { nome: 'Beatriz Lima', pontos: 71.3 },
  { nome: 'Lucas Martins', pontos: 58.9 },
]

/** Do maior para o menor; empate fica em ordem alfabética. */
export function ordenarRanking(linhas: LinhaRanking[]): LinhaRanking[] {
  return [...linhas].sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome, 'pt-BR'))
}
