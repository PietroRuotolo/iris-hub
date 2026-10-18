// Quando o jogo e a calibração pausam. Lógica pura (testada): a cada frame da câmera, `passoPausa`
// recebe o que foi lido e devolve o novo estado e o que aconteceu (pausou, retomou...).
//
// - Olhos fechados ou piscada: pausa na hora, em silêncio (de olhos fechados ninguém vê o jogo parar);
//   só depois de 5 s aparece "Jogo pausado · olhos fechados". Retoma quando os olhos abrem.
// - Cabeça virada ou fora do centro: pausa com aviso e retoma quando a cabeça volta.
// - Mudança de distância: pausa, avisa "Cuidado: isso afeta a jogabilidade do jogo" por 3 s, adota a
//   nova distância como referência, recentraliza (um ponto no centro) e continua sozinho.
// - Leitura falhando por mais de 1 s (rosto sumiu, reflexo...): pausa com aviso, como antes.

import type { DesvioPose } from './pose'
import type { Problema } from './qualidade'

export const TEMPOS_PAUSA = {
  /** Cabeça fora da posição por esse tempo antes de pausar (um movimento rápido não pausa). */
  foraParaPausarMs: 400,
  /** Leitura falhando por esse tempo antes de pausar. */
  semLeituraParaPausarMs: 1000,
  /** Tudo certo por esse tempo antes de retomar. */
  dentroParaRetomarMs: 500,
  /** Olhos abertos por esse tempo antes de retomar (logo depois da piscada). */
  olhosParaRetomarMs: 100,
  /** Olhos fechados por mais que isso: a pausa passa a aparecer. */
  olhosParaAvisarMs: 5000,
  /** Quanto o aviso de distância fica na tela. */
  avisoDistanciaMs: 3000,
  /** Quanto dura a recentralização depois do aviso de distância. */
  recentrarMs: 2000,
}

/** olhos: fechados; girar/centralizar: a cabeça; leitura: a leitura falhando (rosto sumiu, reflexo...). */
export type MotivoPausa = 'olhos' | 'girar' | 'centralizar' | 'leitura'

export type EstadoPausa =
  | { tipo: 'livre'; foraDesde: number | null; semLeituraDesde: number | null }
  | { tipo: 'pausado'; motivo: MotivoPausa; falha: Exclude<Problema, 'piscada'> | null; desde: number; dentroDesde: number | null }
  | { tipo: 'aviso-distancia'; desde: number; pausaDesde: number }
  | { tipo: 'recentrando'; desde: number; pausaDesde: number }

export const ESTADO_LIVRE: EstadoPausa = { tipo: 'livre', foraDesde: null, semLeituraDesde: null }

export interface QuadroPausa {
  agora: number
  olhosFechados: boolean
  /** Desvio da cabeça em relação à referência (desvioDaPose); aproximar/afastar = distância. */
  desvio: DesvioPose | null
  /** Problema da leitura que não é piscada (sem rosto, reflexo, fora da faixa...). */
  falha: Exclude<Problema, 'piscada'> | null
}

/**
 * - pausou: os alvos param a partir de agora;
 * - retomou: voltam, com o tempo empurrado em `pausaMs`;
 * - adotar-distancia: a distância atual vira a de referência;
 * - recentralizar: começou o ponto no centro (colete o olhar até "recentralizado");
 * - recentralizado: aplique a correção com o que coletou.
 */
export type EventoPausa =
  | { tipo: 'pausou' }
  | { tipo: 'retomou'; pausaMs: number }
  | { tipo: 'adotar-distancia' }
  | { tipo: 'recentralizar' }
  | { tipo: 'recentralizado' }

const ehDistancia = (d: DesvioPose | null) => d === 'aproximar' || d === 'afastar'

/** O que ainda prende a pausa neste quadro (a distância não prende: ela só avisa). */
function motivoAtual(q: QuadroPausa): { motivo: MotivoPausa; falha: QuadroPausa['falha'] } | null {
  if (q.olhosFechados) return { motivo: 'olhos', falha: null }
  if (q.desvio === 'girar' || q.desvio === 'centralizar') return { motivo: q.desvio, falha: null }
  if (q.falha) return { motivo: 'leitura', falha: q.falha }
  return null
}

export function passoPausa(estado: EstadoPausa, q: QuadroPausa, t = TEMPOS_PAUSA): { estado: EstadoPausa; eventos: EventoPausa[] } {
  const { agora } = q

  if (estado.tipo === 'livre') {
    if (q.olhosFechados) {
      return { estado: { tipo: 'pausado', motivo: 'olhos', falha: null, desde: agora, dentroDesde: null }, eventos: [{ tipo: 'pausou' }] }
    }
    const fora = q.desvio !== null
    const foraDesde = fora ? (estado.foraDesde ?? agora) : null
    const semLeituraDesde = q.falha ? (estado.semLeituraDesde ?? agora) : null
    if (fora && agora - foraDesde! >= t.foraParaPausarMs) {
      if (ehDistancia(q.desvio)) {
        return {
          estado: { tipo: 'aviso-distancia', desde: agora, pausaDesde: agora },
          eventos: [{ tipo: 'pausou' }, { tipo: 'adotar-distancia' }],
        }
      }
      return { estado: { tipo: 'pausado', motivo: q.desvio as MotivoPausa, falha: null, desde: agora, dentroDesde: null }, eventos: [{ tipo: 'pausou' }] }
    }
    if (q.falha && agora - semLeituraDesde! >= t.semLeituraParaPausarMs) {
      return { estado: { tipo: 'pausado', motivo: 'leitura', falha: q.falha, desde: agora, dentroDesde: null }, eventos: [{ tipo: 'pausou' }] }
    }
    return { estado: { tipo: 'livre', foraDesde, semLeituraDesde }, eventos: [] }
  }

  if (estado.tipo === 'pausado') {
    const atual = motivoAtual(q)
    if (atual) return { estado: { ...estado, ...atual, dentroDesde: null }, eventos: [] }
    const dentroDesde = estado.dentroDesde ?? agora
    const espera = estado.motivo === 'olhos' ? t.olhosParaRetomarMs : t.dentroParaRetomarMs
    if (agora - dentroDesde >= espera) {
      return { estado: ESTADO_LIVRE, eventos: [{ tipo: 'retomou', pausaMs: agora - estado.desde }] }
    }
    return { estado: { ...estado, dentroDesde }, eventos: [] }
  }

  if (estado.tipo === 'aviso-distancia') {
    if (agora - estado.desde >= t.avisoDistanciaMs) {
      return { estado: { tipo: 'recentrando', desde: agora, pausaDesde: estado.pausaDesde }, eventos: [{ tipo: 'recentralizar' }] }
    }
    return { estado, eventos: [] }
  }

  // recentrando
  if (agora - estado.desde >= t.recentrarMs) {
    return { estado: ESTADO_LIVRE, eventos: [{ tipo: 'recentralizado' }, { tipo: 'retomou', pausaMs: agora - estado.pausaDesde }] }
  }
  return { estado, eventos: [] }
}

/** Se o jogo está parado (os alvos não andam). */
export const estaPausado = (estado: EstadoPausa) => estado.tipo !== 'livre'

export interface AvisoPausa {
  titulo: string
  texto: string
  rodape: string
}

const TEXTO_MOTIVO: Record<Exclude<MotivoPausa, 'leitura'>, string> = {
  olhos: 'Olhos fechados.',
  girar: 'Volte a olhar de frente para a tela, sem virar ou inclinar a cabeça.',
  centralizar: 'Volte o rosto para o centro, onde estava na calibração.',
}

/**
 * O aviso na tela, ou null (pausa silenciosa ou recentralizando). `textoDaFalha` traduz o problema da
 * leitura (MENSAGEM_PROBLEMA). `pausado` é o nome do que parou ("Jogo pausado", "Calibração pausada").
 */
export function avisoDaPausa(
  estado: EstadoPausa,
  agora: number,
  textoDaFalha: (falha: Exclude<Problema, 'piscada'>) => string,
  pausado = 'Jogo pausado',
  t = TEMPOS_PAUSA,
): AvisoPausa | null {
  if (estado.tipo === 'aviso-distancia') {
    return { titulo: 'Cuidado', texto: 'Mudar a distância da tela afeta a jogabilidade do jogo.', rodape: 'O jogo continua em instantes.' }
  }
  if (estado.tipo !== 'pausado') return null
  if (estado.motivo === 'olhos') {
    if (agora - estado.desde < t.olhosParaAvisarMs) return null
    return { titulo: `${pausado} · olhos fechados`, texto: TEXTO_MOTIVO.olhos, rodape: 'Continua sozinho quando você abrir os olhos.' }
  }
  const texto = estado.motivo === 'leitura' && estado.falha ? textoDaFalha(estado.falha) : TEXTO_MOTIVO[estado.motivo as Exclude<MotivoPausa, 'leitura'>]
  return { titulo: pausado, texto, rodape: 'Continua sozinho quando você voltar à posição.' }
}
