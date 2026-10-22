// Ajudantes da tela do ranking (a tela inicial). O ranking vem pronto do backend: só quem jogou os 3
// jogos, com a nota de 0 a 100 de cada um (a melhor partida) e a nota geral, já em ordem.

/** As iniciais do nome, para o avatar (no máximo duas). */
export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

/** Uma nota de 0 a 100 com no máximo uma casa decimal, no formato brasileiro (86,7). */
export function formatarNota(nota: number): string {
  return nota.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}