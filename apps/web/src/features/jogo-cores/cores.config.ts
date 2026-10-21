// As 5 cores do jogo (as mesmas dos botões da caixa do ESP32), com o som de cada uma e a tecla que vale
// como o botão no modo simulação. As cores vêm dos tokens (--color-cor-*, em tokens.css).

export interface CorJogo {
  /** O número da cor no ESP32 (0 a 4). */
  id: number
  nome: string
  /** A nota que toca quando a cor acende (Hz). */
  frequencia: number
  /** A cor, como variável CSS. */
  cor: string
  /** Tecla que aperta esta cor no modo simulação. */
  tecla: string
}

export const CORES_JOGO: CorJogo[] = [
  { id: 0, nome: 'Cinza', frequencia: 261.63, cor: 'var(--color-cor-cinza)', tecla: '1' },
  { id: 1, nome: 'Amarelo', frequencia: 329.63, cor: 'var(--color-cor-amarelo)', tecla: '2' },
  { id: 2, nome: 'Verde', frequencia: 392.0, cor: 'var(--color-cor-verde)', tecla: '3' },
  { id: 3, nome: 'Vermelho', frequencia: 523.25, cor: 'var(--color-cor-vermelho)', tecla: '4' },
  { id: 4, nome: 'Azul', frequencia: 659.25, cor: 'var(--color-cor-azul)', tecla: '5' },
]