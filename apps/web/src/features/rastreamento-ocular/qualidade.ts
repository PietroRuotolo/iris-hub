// Qualidade de cada leitura da câmera: reflexo nos olhos (óculos), luz, distância e rotação da
// cabeça. Funções puras sobre a luminância dos pixels (0..255) e a pose, testáveis sem câmera.

import type { FeaturesOlhar, PoseCabeca } from './features'
import { ehPiscada } from './features'

export type Problema =
  | 'semRosto'
  | 'piscada'
  | 'reflexo'
  | 'perto'
  | 'longe'
  | 'virado'
  | 'descentralizado'
  | 'poucaLuz'
  | 'contraluz'

/** Faixa de distância para calibrar (cm) e limites de rotação da cabeça (graus). */
export const FAIXA_DISTANCIA_CM = { min: 40, max: 75 }
export const LIMITE_ROTACAO_GRAUS = { yaw: 12, pitch: 15, roll: 10 }
/** Fora disto a leitura não vale nem durante o jogo (cabeça muito virada, muito perto ou longe). */
export const LIMITE_LEITURA = { yaw: 25, pitch: 25, distanciaMin: 28, distanciaMax: 100 }

/** Pixel "estourado": o brilho de um reflexo. */
const BRILHO_REFLEXO = 235

export function luminancia(rgba: ArrayLike<number>): Float32Array {
  const lum = new Float32Array(rgba.length / 4)
  for (let i = 0; i < lum.length; i++) lum[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]
  return lum
}

const media = (valores: ArrayLike<number>) => {
  let soma = 0
  for (let i = 0; i < valores.length; i++) soma += valores[i]
  return valores.length ? soma / valores.length : 0
}

export interface MedidaReflexo {
  /** Fração de pixels estourados na região do olho. */
  fracaoBrilho: number
  /** Fração de pixels estourados sobre a íris. */
  fracaoBrilhoIris: number
  /** Brilho médio da íris (normalmente escura; lavada por reflexo fica clara). */
  mediaIris: number
}

/**
 * Mede o reflexo num recorte do olho (luminância, largura x altura), com a íris em (cx, cy) e
 * raio r no próprio recorte. O brilho natural do olho é um ponto minúsculo; o reflexo de óculos
 * cobre uma área grande ou deixa a íris clara.
 */
export function medirReflexo(lum: ArrayLike<number>, largura: number, altura: number, iris: { cx: number; cy: number; r: number }): MedidaReflexo {
  let brilho = 0
  let brilhoIris = 0
  let pixelsIris = 0
  let somaIris = 0
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const l = lum[y * largura + x]
      const estourado = l >= BRILHO_REFLEXO
      if (estourado) brilho++
      if (Math.hypot(x - iris.cx, y - iris.cy) <= iris.r) {
        pixelsIris++
        somaIris += l
        if (estourado) brilhoIris++
      }
    }
  }
  return {
    fracaoBrilho: brilho / (largura * altura),
    fracaoBrilhoIris: pixelsIris ? brilhoIris / pixelsIris : 0,
    mediaIris: pixelsIris ? somaIris / pixelsIris : 0,
  }
}

export function temReflexo(m: MedidaReflexo): boolean {
  return m.fracaoBrilhoIris > 0.15 || m.fracaoBrilho > 0.08 || m.mediaIris > 170
}

export interface MedidaLuz {
  /** Brilho médio do rosto e da imagem inteira (0..255). */
  rosto: number
  quadro: number
}

export function medirLuz(lumRosto: ArrayLike<number>, lumQuadro: ArrayLike<number>): MedidaLuz {
  return { rosto: media(lumRosto), quadro: media(lumQuadro) }
}

export function problemaDeLuz({ rosto, quadro }: MedidaLuz): 'poucaLuz' | 'contraluz' | null {
  if (rosto < 55) return 'poucaLuz'
  if (quadro - rosto > 45 && rosto < 110) return 'contraluz'
  return null
}

/**
 * Bordas horizontais no recorte entre os olhos (luminância): a ponte da armação dos óculos cria uma
 * linha marcada; pele lisa, não. É uma estimativa, não uma certeza.
 */
export function medirPonteOculos(lum: ArrayLike<number>, largura: number, altura: number): number {
  let soma = 0
  for (let y = 1; y < altura; y++) {
    for (let x = 0; x < largura; x++) soma += Math.abs(lum[y * largura + x] - lum[(y - 1) * largura + x])
  }
  return soma / (largura * (altura - 1) * 255)
}

export const pareceOculos = (bordasPonte: number) => bordasPonte > 0.06

/** Problemas que invalidam uma leitura (ela não entra na calibração nem conta no jogo). */
export function problemasDaLeitura(features: FeaturesOlhar | null, reflexo: boolean): Problema[] {
  if (!features) return ['semRosto']
  const { pose } = features
  const problemas: Problema[] = []
  if (ehPiscada(features)) problemas.push('piscada')
  if (reflexo) problemas.push('reflexo')
  if (pose.distanciaCm < LIMITE_LEITURA.distanciaMin) problemas.push('perto')
  if (pose.distanciaCm > LIMITE_LEITURA.distanciaMax) problemas.push('longe')
  if (Math.abs(pose.yawGraus) > LIMITE_LEITURA.yaw || Math.abs(pose.pitchGraus) > LIMITE_LEITURA.pitch) problemas.push('virado')
  return problemas
}

export interface ItemChecklist {
  id: 'rosto' | 'distancia' | 'centro' | 'cabeca' | 'luz' | 'reflexo'
  ok: boolean
  titulo: string
  detalhe: string
}

/** Checklist da tela "Posicione-se": a calibração só começa com tudo ok. */
export function checklistPosicionamento(
  pose: PoseCabeca | null,
  luz: MedidaLuz | null,
  reflexo: { esquerdo: boolean; direito: boolean } | null,
): ItemChecklist[] {
  if (!pose) {
    return [{ id: 'rosto', ok: false, titulo: 'Rosto', detalhe: 'Não detectado. Fique de frente para a câmera.' }]
  }
  const distancia = Math.round(pose.distanciaCm)
  const perto = pose.distanciaCm < FAIXA_DISTANCIA_CM.min
  const longe = pose.distanciaCm > FAIXA_DISTANCIA_CM.max
  const centralizado = Math.abs(pose.centroX - 0.5) < 0.2 && Math.abs(pose.centroY - 0.45) < 0.25
  const reta =
    Math.abs(pose.yawGraus) <= LIMITE_ROTACAO_GRAUS.yaw &&
    Math.abs(pose.pitchGraus) <= LIMITE_ROTACAO_GRAUS.pitch &&
    Math.abs(pose.rollGraus) <= LIMITE_ROTACAO_GRAUS.roll
  const luzProblema = luz ? problemaDeLuz(luz) : null
  const ladosReflexo = reflexo ? [reflexo.direito && 'direito', reflexo.esquerdo && 'esquerdo'].filter(Boolean) : []

  return [
    { id: 'rosto', ok: true, titulo: 'Rosto', detalhe: 'Detectado' },
    {
      id: 'distancia',
      ok: !perto && !longe,
      titulo: 'Distância',
      detalhe: perto ? `~${distancia} cm: afaste-se um pouco` : longe ? `~${distancia} cm: chegue mais perto` : `~${distancia} cm`,
    },
    { id: 'centro', ok: centralizado, titulo: 'Centralizado', detalhe: centralizado ? 'Rosto no centro da câmera' : 'Centralize o rosto na câmera' },
    {
      id: 'cabeca',
      ok: reta,
      titulo: 'Cabeça reta',
      detalhe: reta ? 'De frente para a tela' : 'Olhe de frente para a tela, sem virar ou inclinar a cabeça',
    },
    {
      id: 'luz',
      ok: !luzProblema,
      titulo: 'Luz',
      detalhe:
        luzProblema === 'poucaLuz'
          ? 'Pouca luz no rosto: acenda uma luz à sua frente'
          : luzProblema === 'contraluz'
            ? 'Luz forte atrás de você: vire-se ou feche a janela'
            : 'Boa',
    },
    {
      id: 'reflexo',
      ok: ladosReflexo.length === 0,
      titulo: 'Reflexo nos olhos',
      detalhe: ladosReflexo.length
        ? `Reflexo no olho ${ladosReflexo.join(' e ')}: incline a tela, mude a luz de lugar ou baixe o brilho da tela`
        : 'Sem reflexo',
    },
  ]
}

export const MENSAGEM_PROBLEMA: Record<Problema, string> = {
  semRosto: 'Rosto não detectado. Volte para a frente da câmera.',
  piscada: 'Olhos fechados.',
  reflexo: 'Reflexo nos óculos atrapalhando a leitura do olho.',
  perto: 'Muito perto da câmera. Afaste-se um pouco.',
  longe: 'Muito longe da câmera. Chegue mais perto.',
  virado: 'Cabeça virada. Olhe de frente para a tela.',
  descentralizado: 'Centralize o rosto na câmera.',
  poucaLuz: 'Pouca luz no rosto.',
  contraluz: 'Luz forte atrás de você.',
}
