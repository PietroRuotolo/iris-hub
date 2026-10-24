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
    /** A cor do brilho em volta quando acende (se não for a própria cor). */
  brilho?: string
}

export const CORES_JOGO: CorJogo[] = [
    { id: 0, nome: 'Branco', frequencia: 261.63, cor: 'var(--color-cor-branco)', tecla: '1', brilho: 'var(--color-ink-soft)' },
  { id: 1, nome: 'Amarelo', frequencia: 329.63, cor: 'var(--color-cor-amarelo)', tecla: '2' },
  { id: 2, nome: 'Verde', frequencia: 392.0, cor: 'var(--color-cor-verde)', tecla: '3' },
  { id: 3, nome: 'Vermelho', frequencia: 523.25, cor: 'var(--color-cor-vermelho)', tecla: '4' },
  { id: 4, nome: 'Azul', frequencia: 659.25, cor: 'var(--color-cor-azul)', tecla: '5' },
]


/** Contorno fino para as cores aparecerem no fundo claro (principalmente o branco). Vai no box-shadow. */
export const CONTORNO_COR = 'inset 0 0 0 1.5px color-mix(in srgb, var(--color-navy) 22%, transparent)'