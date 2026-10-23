// Modo teste dos jogos com ESP32 (?teste na URL, também em produção): sem a caixa, o teclado e o clique
// fazem o papel dos botões. No reflexo, a barra de espaço e o clique na área do jogo; nas cores, as teclas
// 1 a 5 (uma para cada cor) e o clique nas cores. A partida conta pontos e é gravada normalmente (o
// acionamento fica registrado). Diferente do ?simular (simulador.ts), que só existe em desenvolvimento.

export const PARAMETRO_TESTE = 'teste'

export function modoTeste(busca: string | null = typeof window === 'undefined' ? null : window.location.search): boolean {
  return busca !== null && new URLSearchParams(busca).has(PARAMETRO_TESTE)
}
