// As cinco fases do jogo de ritmo. Cada fase gera a lista de alvos: posição normalizada (0..1)
// na área dos alvos, tamanho em cm (convertido para px conforme a tela em Configurações), o
// momento da batida e quanto tempo antes dela o alvo aparece.

import { FASES_JOGO } from '@iris/contracts'

export interface AlvoPlanejado {
  numero: number
  x: number
  y: number
  raioCm: number
  /** Momento da batida, em ms desde o início da fase. */
  batidaMs: number
  /** Quanto tempo antes da batida o alvo aparece (o anel fecha até a batida). */
  antecedenciaMs: number
}

export interface ConfigFase {
  fase: number
  nome: string
  descricao: string
  gerar: (aleatorio?: () => number) => AlvoPlanejado[]
}

type Passo = { x: number; y: number; raioCm: number; intervaloMs: number; antecedenciaMs: number }

/** Espera antes da primeira batida de cada fase, além da antecedência do primeiro alvo. */
export const ESPERA_INICIAL_MS = 1000

function montar(passos: Passo[]): AlvoPlanejado[] {
  let batidaMs = ESPERA_INICIAL_MS
  return passos.map((p, i) => {
    batidaMs += i === 0 ? p.antecedenciaMs : p.intervaloMs
    return { numero: i + 1, x: p.x, y: p.y, raioCm: p.raioCm, batidaMs, antecedenciaMs: p.antecedenciaMs }
  })
}

const CENTRO = { x: 0.5, y: 0.5 }
const CRUZ = [CENTRO, { x: 0.15, y: 0.5 }, CENTRO, { x: 0.85, y: 0.5 }, CENTRO, { x: 0.5, y: 0.1 }, CENTRO, { x: 0.5, y: 0.9 }]
// Seis posições num círculo, no sentido horário a partir do topo.
const RODA = Array.from({ length: 6 }, (_, i) => {
  const angulo = -Math.PI / 2 + (i * Math.PI) / 3
  return { x: 0.5 + 0.4 * Math.cos(angulo), y: 0.5 + 0.4 * Math.sin(angulo) }
})
// Troca de lado a cada alvo e de altura a cada dois.
const ZIGUE = [{ x: 0.1, y: 0.15 }, { x: 0.9, y: 0.85 }, { x: 0.1, y: 0.85 }, { x: 0.9, y: 0.15 }]

/** Posições sorteadas, sempre a pelo menos `distanciaMin` da anterior (o olho precisa se mover). */
function sortearPosicoes(n: number, aleatorio: () => number, distanciaMin = 0.3) {
  const posicoes: { x: number; y: number }[] = []
  while (posicoes.length < n) {
    const p = { x: 0.05 + 0.9 * aleatorio(), y: 0.05 + 0.9 * aleatorio() }
    const anterior = posicoes[posicoes.length - 1]
    if (!anterior || Math.hypot(p.x - anterior.x, p.y - anterior.y) >= distanciaMin) posicoes.push(p)
  }
  return posicoes
}

const nome = (fase: number) => FASES_JOGO.find((f) => f.fase === fase)!.nome

export const FASES: ConfigFase[] = [
  {
    fase: 1,
    nome: nome(1),
    descricao: 'Alvos grandes, ritmo lento e sequência simples para aprender a jogar com o olhar.',
    gerar: () => montar(CRUZ.map((p) => ({ ...p, raioCm: 3.5, intervaloMs: 2200, antecedenciaMs: 1500 }))),
  },
  {
    fase: 2,
    nome: nome(2),
    descricao: 'Os alvos aparecem em batidas regulares, em posições previsíveis ao redor da tela.',
    gerar: () => montar([...RODA, ...RODA].map((p) => ({ ...p, raioCm: 3, intervaloMs: 1600, antecedenciaMs: 1200 }))),
  },
  {
    fase: 3,
    nome: nome(3),
    descricao: 'Acompanhe os alvos que mudam de lado e de altura seguindo o ritmo.',
    gerar: () => montar([...ZIGUE, ...ZIGUE, ...ZIGUE].map((p) => ({ ...p, raioCm: 2.8, intervaloMs: 1400, antecedenciaMs: 1000 }))),
  },
  {
    fase: 4,
    nome: nome(4),
    descricao: 'Alvos menores e intervalos mais curtos: a exigência aumenta aos poucos.',
    gerar: (aleatorio = Math.random) =>
      montar(
        sortearPosicoes(16, aleatorio).map((p, i) => {
          const f = i / 15
          return { ...p, raioCm: 2.6 - 0.8 * f, intervaloMs: Math.round(1300 - 400 * f), antecedenciaMs: Math.round(1000 - 250 * f) }
        }),
      ),
  },
  {
    fase: 5,
    nome: nome(5),
    descricao: 'Combina as posições, os ritmos e as pausas das fases anteriores.',
    gerar: (aleatorio = Math.random) =>
      montar([
        ...[RODA[0], RODA[2], RODA[4], RODA[1]].map((p) => ({ ...p, raioCm: 2.6, intervaloMs: 1400, antecedenciaMs: 1100 })),
        ...ZIGUE.map((p, i) => ({ ...p, raioCm: 2.4, intervaloMs: i === 0 ? 2400 : 1100, antecedenciaMs: 900 })),
        ...sortearPosicoes(6, aleatorio).map((p, i) => ({ ...p, raioCm: 2.2, intervaloMs: i === 0 ? 2200 : 1000, antecedenciaMs: 800 })),
        ...CRUZ.slice(0, 6).map((p, i) => ({ ...p, raioCm: 2, intervaloMs: i === 0 ? 2000 : 1200, antecedenciaMs: 900 })),
      ]),
  },
]

/** Raio mínimo em px, para o alvo continuar jogável mesmo numa tela pequena. */
export const RAIO_MIN_PX = 45

/**
 * Raio do alvo em px: o tamanho em cm convertido pela tela, nunca menor que o erro medido na
 * calibração (senão ninguém acerta) nem que `fracaoMinima` da área (telas pequenas, como a do
 * celular), e nunca maior que 16% da área dos alvos.
 */
export function raioEmPx(
  raioCm: number,
  pxPorCm: number,
  erroCalibracaoPx: number | null,
  area: { largura: number; altura: number },
  fracaoMinima = 0,
): number {
  const menorLado = Math.min(area.largura, area.altura)
  const piso = Math.max(RAIO_MIN_PX, 0.8 * (erroCalibracaoPx ?? 0), fracaoMinima * menorLado)
  const teto = Math.max(0.16 * menorLado, piso)
  return Math.round(Math.min(Math.max(raioCm * pxPorCm, piso), teto))
}
