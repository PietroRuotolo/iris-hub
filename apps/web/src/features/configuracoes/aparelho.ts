// Tipo de aparelho em que se joga (celular, tablet ou computador) e o que muda em cada um: distância
// da câmera, tolerâncias da pose, tempo de coleta da calibração e tamanho mínimo dos alvos.

import { polegadasDe, type ConfigTela, type TipoTela } from './tela'

export type Aparelho = 'celular' | 'tablet' | 'computador'

export interface PerfilAparelho {
  /** Faixa de distância para calibrar (cm). */
  distanciaCm: { min: number; max: number }
  /** Fora disto a leitura não vale nem durante o jogo (cm). */
  leituraDistanciaCm: { min: number; max: number }
  /** Quanto a cabeça pode sair da posição da calibração antes de o jogo pausar. */
  pose: { distancia: number; rotacaoGraus: number; posicao: number }
  /** Tempos de cada ponto da calibração (ms). */
  coleta: { acomodacaoMs: number; coletaMs: number }
  /** Raio mínimo dos alvos, em fração do menor lado da área dos alvos. */
  raioMinFracao: number
  /** Pede o aparelho deitado (a tela ocupa um ângulo maior da visão). */
  exigeHorizontal: boolean
  /** Pede o aparelho apoiado (parado em relação ao rosto). */
  exigeApoio: boolean
}

export const PERFIS: Record<Aparelho, PerfilAparelho> = {
  celular: {
    distanciaCm: { min: 20, max: 45 },
    leituraDistanciaCm: { min: 12, max: 70 },
    pose: { distancia: 0.3, rotacaoGraus: 22, posicao: 0.22 },
    coleta: { acomodacaoMs: 1000, coletaMs: 1800 },
    raioMinFracao: 0.11,
    exigeHorizontal: true,
    exigeApoio: true,
  },
  tablet: {
    distanciaCm: { min: 30, max: 60 },
    leituraDistanciaCm: { min: 18, max: 85 },
    pose: { distancia: 0.25, rotacaoGraus: 18, posicao: 0.18 },
    coleta: { acomodacaoMs: 1000, coletaMs: 1500 },
    raioMinFracao: 0.08,
    exigeHorizontal: false,
    exigeApoio: true,
  },
  computador: {
    distanciaCm: { min: 40, max: 75 },
    leituraDistanciaCm: { min: 28, max: 100 },
    pose: { distancia: 0.2, rotacaoGraus: 15, posicao: 0.15 },
    coleta: { acomodacaoMs: 800, coletaMs: 1200 },
    raioMinFracao: 0,
    exigeHorizontal: false,
    exigeApoio: false,
  },
}

/** Pelo tamanho da tela e pelo toque: tela pequena com toque é celular; média com toque, tablet. */
export function classificarAparelho({ toque, menorLadoPx }: { toque: boolean; menorLadoPx: number }): Aparelho {
  if (toque && menorLadoPx < 600) return 'celular'
  if (toque && menorLadoPx < 1100) return 'tablet'
  return 'computador'
}

/** O aparelho deste navegador (só no navegador). */
export function detectarAparelho(): Aparelho {
  return classificarAparelho({
    toque: window.matchMedia('(pointer: coarse)').matches,
    menorLadoPx: Math.min(window.screen.width, window.screen.height),
  })
}

/** Tipo de tela sugerido em Configurações para o aparelho detectado. */
export const TIPO_TELA_DO_APARELHO: Record<Aparelho, TipoTela> = { celular: 'celular', tablet: 'tablet', computador: 'computador' }

/** O aparelho segundo a tela escolhida em Configurações (no manual, pelo tamanho). */
export function aparelhoDaConfig(config: ConfigTela): Aparelho {
  if (config.tipo === 'celular' || config.tipo === 'tablet') return config.tipo
  if (config.tipo !== 'manual') return 'computador'
  const polegadas = polegadasDe(config) ?? 24
  return polegadas < 8 ? 'celular' : polegadas < 13 ? 'tablet' : 'computador'
}
