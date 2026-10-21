// Modo simulação dos jogos com ESP32 (só em desenvolvimento, com ?simular na URL): sem a caixa, o clique e
// o teclado fazem o papel dos botões. No reflexo, o clique na área do jogo e o espaço; nas cores, o clique
// em cada cor e as teclas 1 a 5. As partidas são gravadas no banco como as de verdade.

/** Só em desenvolvimento e com `?simular` na URL (como o `?simular` do jogo de ritmo). */
export function simulacaoLigada(): boolean {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('simular')
}