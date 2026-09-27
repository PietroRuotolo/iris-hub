// Posição da cabeça em relação à da calibração. O mapeamento já compensa movimentos pequenos da
// cabeça; movimentos grandes saem da faixa que a calibração viu, e aí o jogo pausa e pede para a
// pessoa voltar.

import type { PoseCabeca } from './features'

export type Pose = PoseCabeca

export type DesvioPose = 'centralizar' | 'aproximar' | 'afastar' | 'girar'

/** Limites tolerados: distância em fração da de referência, rotação em graus, posição em fração da imagem. */
export const LIMITES_POSE = { distancia: 0.2, rotacaoGraus: 15, posicao: 0.15 }

function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2
}

/** Pose típica de um conjunto de leituras (mediana de cada medida, que ignora leituras soltas). */
export function poseDeReferencia(poses: Pose[]): Pose {
  const m = (campo: keyof Pose) => mediana(poses.map((p) => p[campo]))
  return {
    distanciaCm: m('distanciaCm'),
    yawGraus: m('yawGraus'),
    pitchGraus: m('pitchGraus'),
    rollGraus: m('rollGraus'),
    centroX: m('centroX'),
    centroY: m('centroY'),
  }
}

/** O que corrigir na posição da cabeça, ou null se ela está perto da referência. */
export function desvioDaPose(atual: Pose, referencia: Pose, limites: typeof LIMITES_POSE = LIMITES_POSE): DesvioPose | null {
  const proporcao = atual.distanciaCm / referencia.distanciaCm
  if (proporcao < 1 - limites.distancia) return 'afastar'
  if (proporcao > 1 + limites.distancia) return 'aproximar'
  const giro = (a: number, b: number) => Math.abs(a - b) > limites.rotacaoGraus
  if (giro(atual.yawGraus, referencia.yawGraus) || giro(atual.pitchGraus, referencia.pitchGraus) || giro(atual.rollGraus, referencia.rollGraus)) {
    return 'girar'
  }
  if (Math.abs(atual.centroX - referencia.centroX) > limites.posicao || Math.abs(atual.centroY - referencia.centroY) > limites.posicao) {
    return 'centralizar'
  }
  return null
}

export const MENSAGEM_DESVIO: Record<DesvioPose, string> = {
  centralizar: 'Volte o rosto para o centro, onde estava na calibração.',
  aproximar: 'Você se afastou: chegue um pouco mais perto da tela.',
  afastar: 'Você chegou perto demais: afaste-se um pouco da tela.',
  girar: 'Olhe de frente para a tela, sem virar ou inclinar a cabeça.',
}
