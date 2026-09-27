// História de introdução: 7 telas de 10 segundos, com imagem de fundo (public/history/<n>history.png,
// na ordem da tela) e o texto animado por cima. No primeiro acesso ela é obrigatória; pelo menu "Introdução" dá para navegar.

export const DURACAO_SLIDE_MS = 10_000

/** Um trecho de texto: normal (fino), forte (negrito escuro) ou um número que conta até o valor. */
export type Parte = { texto: string; forte?: boolean } | { numero: number; casas: number }

export interface Bloco {
  /** "leve": texto fino escuro; "destaque": texto grande em terracota. */
  tipo: 'leve' | 'destaque'
  partes: Parte[]
}

export interface Slide {
  imagem: string
  /** Ponto da imagem para onde a câmera "entra" (rostos), em % da largura e da altura. */
  foco: { x: number; y: number }
  blocos: Bloco[]
  subtitulo: string
}

const leve = (...partes: Parte[]): Bloco => ({ tipo: 'leve', partes })
const destaque = (...partes: Parte[]): Bloco => ({ tipo: 'destaque', partes })

export const SLIDES: Slide[] = [
  {
    imagem: '/history/1history.png',
    foco: { x: 68, y: 38 },
    blocos: [
      leve({ texto: 'Estudos de 2026 apontam que a ' }, { texto: 'demência', forte: true }, { texto: ' eleva em mais de' }),
      destaque({ numero: 2.6, casas: 1 }, { texto: ' vezes o risco de mortalidade' }),
      leve({ texto: 'entre idosos.' }),
    ],
    subtitulo: 'Um dado que reforça a urgência de detectar cedo, informar melhor e ampliar o tempo de cuidado.',
  },
  {
    imagem: '/history/2history.png',
    foco: { x: 62, y: 32 },
    blocos: [
      leve({ texto: 'Entre idosos, e as projeções mostram que o número de casos no Brasil pode ultrapassar' }),
      destaque({ numero: 5.6, casas: 1 }, { texto: ' milhões' }),
      leve({ texto: 'nas próximas décadas.' }),
    ],
    subtitulo: 'Um cenário que exige prevenção, informação e novas formas de cuidado.',
  },
  {
    imagem: '/history/3history.png',
    foco: { x: 72, y: 32 },
    blocos: [
      leve({ texto: 'A detecção tardia ainda é o ' }, { texto: 'maior obstáculo', forte: true }),
      destaque({ texto: 'para salvar autonomia e vidas.' }),
    ],
    subtitulo: 'Quando o cuidado chega tarde, o tempo de agir já está mais curto.',
  },
  {
    imagem: '/history/4history.png',
    foco: { x: 76, y: 34 },
    blocos: [
      leve({ texto: 'O Íris nasceu dessa ' }, { texto: 'dor silenciosa', forte: true }),
      destaque({ texto: 'que afeta milhões de famílias.' }),
    ],
    subtitulo: 'Uma realidade vivida em silêncio por quem cuida e por quem ama.',
  },
  {
    imagem: '/history/5history.png',
    foco: { x: 70, y: 36 },
    blocos: [leve({ texto: 'A tecnologia preventiva' }), destaque({ texto: 'entra como virada de jogo.' })],
    subtitulo: 'Mais saúde, mais autonomia e mais tempo para o que importa.',
  },
  {
    imagem: '/history/6history.png',
    foco: { x: 70, y: 34 },
    blocos: [
      leve({ texto: 'O Íris possibilita identificar' }),
      destaque({ texto: 'sinais de declínio cognitivo' }),
      leve({ texto: 'anos antes das fases avançadas.' }),
    ],
    subtitulo: 'Antes do agravamento, existe uma janela valiosa para intervir.',
  },
  {
    imagem: '/history/7history.png',
    foco: { x: 74, y: 38 },
    blocos: [leve({ texto: 'Detectar cedo não é apenas diagnóstico:' }), destaque({ texto: 'é devolver o amanhã a quem amamos' })],
    subtitulo: 'Mais saúde. Mais tempo. Mais histórias juntos.',
  },
]

export const formatarNumero = (valor: number, casas: number) => valor.toFixed(casas).replace('.', ',')

/** O texto do slide inteiro, para leitores de tela (as palavras animadas ficam escondidas deles). */
export function textoDoSlide(slide: Slide): string {
  const bloco = (b: Bloco) => b.partes.map((p) => ('numero' in p ? formatarNumero(p.numero, p.casas) : p.texto)).join('')
  return `${slide.blocos.map(bloco).join(' ')} ${slide.subtitulo}`
}

export interface Palavra {
  texto: string
  forte: boolean
  numero?: { valor: number; casas: number }
  /** Início da animação desta palavra (s). */
  atraso: number
}

/** Momento em que a linha verde e o subtítulo aparecem, depois de todas as palavras. */
export interface Linha {
  tipo: Bloco['tipo']
  palavras: Palavra[]
}

/**
 * Divide os blocos em palavras e calcula quando cada uma entra: o texto fino entra em sequência
 * rápida, e o destaque mais devagar, com impacto. Devolve também quando entra o subtítulo.
 */
export function cronograma(slide: Slide): { linhas: Linha[]; subtituloEm: number } {
  let t = 0.7
  const linhas = slide.blocos.map((bloco) => {
    const palavras: Palavra[] = []
    for (const parte of bloco.partes) {
      if ('numero' in parte) {
        palavras.push({ texto: formatarNumero(parte.numero, parte.casas), forte: true, numero: { valor: parte.numero, casas: parte.casas }, atraso: t })
        t += 0.14
        continue
      }
      for (const texto of parte.texto.match(/\s*\S+\s*/g) ?? []) {
        palavras.push({ texto, forte: !!parte.forte, atraso: t })
        t += bloco.tipo === 'destaque' ? 0.14 : 0.07
      }
    }
    t += 0.3
    return { tipo: bloco.tipo, palavras }
  })
  return { linhas, subtituloEm: t + 0.2 }
}
