// Da calibração ao mapeamento: ajusta o modelo com os 9 pontos, mede a qualidade nos pontos de
// validação e, na conferência, reajusta com os pontos que ficaram longe. Lógica pura (sem câmera nem DOM).

import type { FeaturesOlhar, Ponto } from '@/features/rastreamento-ocular/features'
import { ajustarMapeamento, erroPixel, type MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import type { Problema } from '@/features/rastreamento-ocular/qualidade'
import type { PontoTela } from './pontos'

/** Mínimo de leituras válidas (sem piscada) por ponto para o ponto contar. */
export const MIN_AMOSTRAS = 10

export interface ColetaPonto {
  ponto: PontoTela
  /** Posição do alvo em px quando foi mostrado. */
  alvoPx: Ponto
  amostras: FeaturesOlhar[]
  /** Frames da câmera durante a coleta (com ou sem rosto). */
  frames: number
  /** Quantos frames tiveram cada problema que invalidou a leitura (reflexo, piscada…). */
  problemas: Partial<Record<Problema, number>>
  /** Frames com reflexo nos olhos, mesmo quando o reflexo foi ignorado. */
  framesComReflexo: number
}

/** O problema mais frequente nas coletas (o motivo de uma calibração falhar), com a fração dos frames. */
export function problemaPrincipal(coletas: ColetaPonto[]): { problema: Problema; fracao: number } | null {
  const frames = coletas.reduce((s, c) => s + c.frames, 0)
  const soma: Partial<Record<Problema, number>> = {}
  for (const c of coletas) for (const [p, n] of Object.entries(c.problemas) as [Problema, number][]) soma[p] = (soma[p] ?? 0) + n
  const [problema, n] = (Object.entries(soma) as [Problema, number][]).sort((a, b) => b[1] - a[1])[0] ?? []
  return problema && frames ? { problema, fracao: n / frames } : null
}

export interface ResultadoCalibracao {
  modelo: MapeamentoOlhar
  /** Pontos usados no ajuste (calibração + conferências). */
  pontos: number
  erroMedioPx: number | null
  /** 0 a 1: 1 = sem erro; chega a 0 com um erro de 25% da diagonal da tela. */
  qualidade: number | null
  /** 0 a 1: fração dos frames com o olhar lido. */
  coberturaValida: number
  /** Distância mediana da pessoa à câmera durante a calibração (cm). */
  distanciaMediaCm: number | null
  /** 0 a 1: fração dos frames com reflexo nos olhos. */
  fracaoReflexo: number
}

export function pontosInsuficientes(coletas: ColetaPonto[]): number {
  return coletas.filter((c) => c.amostras.length < MIN_AMOSTRAS).length
}

function mediana(valores: number[]): number {
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2
}

/**
 * Tira as leituras soltas de um ponto (piscada mal detectada, olho ainda chegando ao alvo): fica
 * só o que está a até 3 desvios absolutos medianos da mediana, em h e em v.
 */
export function filtrarLeituras(amostras: FeaturesOlhar[]): FeaturesOlhar[] {
  if (amostras.length < 5) return amostras
  const dentro = (valores: number[]) => {
    const m = mediana(valores)
    const mad = mediana(valores.map((v) => Math.abs(v - m)))
    // Piso de 0,002 (≈1% do alcance do olho): com leituras quase iguais o MAD vai a zero.
    return (v: number) => Math.abs(v - m) <= Math.max(3 * mad, 0.002)
  }
  const okH = dentro(amostras.map((a) => a.h))
  const okV = dentro(amostras.map((a) => a.v))
  return amostras.filter((a) => okH(a.h) && okV(a.v))
}

/** Ajusta o mapeamento com todas as coletas (calibração e as rodadas de conferência já feitas). */
export function ajustarCalibracao(coletas: ColetaPonto[]): MapeamentoOlhar {
  const usadas = coletas.filter((c) => c.amostras.length >= MIN_AMOSTRAS).map((c) => ({ ...c, amostras: filtrarLeituras(c.amostras) }))
  return ajustarMapeamento(
    usadas.flatMap((c) => c.amostras),
    usadas.flatMap((c) => c.amostras.map(() => c.alvoPx)),
  )
}

/** Onde o modelo acha que a pessoa olhou, em média, durante a coleta. null sem leituras suficientes. */
function estimativaMedia(modelo: MapeamentoOlhar, coleta: ColetaPonto): Ponto | null {
  if (coleta.amostras.length < MIN_AMOSTRAS) return null
  const previstos = modelo.preverVarios(filtrarLeituras(coleta.amostras))
  return [previstos.reduce((s, p) => s + p[0], 0) / previstos.length, previstos.reduce((s, p) => s + p[1], 0) / previstos.length]
}

/** Distância entre onde o modelo acha que a pessoa olhou (média) e o alvo. null sem leituras suficientes. */
export function medirColeta(modelo: MapeamentoOlhar, coleta: ColetaPonto): number | null {
  const media = estimativaMedia(modelo, coleta)
  return media && erroPixel(media, coleta.alvoPx)
}

/** Um desvio maior que isto (fração da diagonal) num único ponto é tratado como leitura ruim, não corrigido. */
const DESVIO_MAXIMO_RECENTRALIZAR = 0.3

/**
 * Recentraliza o mapeamento por um ponto conhecido (a pessoa olhou para ele): desloca a estimativa
 * pela diferença medida. Usado antes de cada fase. Sem leituras suficientes, ou com um desvio
 * absurdo, devolve o mesmo modelo.
 */
export function recentralizar(modelo: MapeamentoOlhar, coleta: ColetaPonto, diagonalPx: number): { modelo: MapeamentoOlhar; desvioPx: number | null } {
  const media = estimativaMedia(modelo, coleta)
  if (!media) return { modelo, desvioPx: null }
  const desvio: Ponto = [coleta.alvoPx[0] - media[0], coleta.alvoPx[1] - media[1]]
  const tamanho = Math.hypot(desvio[0], desvio[1])
  if (tamanho > DESVIO_MAXIMO_RECENTRALIZAR * diagonalPx) return { modelo, desvioPx: tamanho }
  return { modelo: modelo.comCorrecao(desvio), desvioPx: tamanho }
}

/**
 * Refaz o mapeamento depois de uma conferência reprovada. `rodadas[0]` é a calibração e as
 * seguintes são as conferências, da mais antiga à mais nova:
 * 1. cada rodada pesa mais que a anterior (a cabeça pode ter mudado de posição desde a calibração);
 * 2. o desvio que sobra na rodada mais recente, se for para o mesmo lado em todos os pontos, é
 *    corrigido deslocando a estimativa.
 */
export function reajustarCalibracao(rodadas: ColetaPonto[][]): MapeamentoOlhar {
  const ponderadas = rodadas.flatMap((coletas, i) =>
    coletas.map((c) => ({ ...c, amostras: Array.from({ length: i + 1 }, () => c.amostras).flat() })),
  )
  const modelo = ajustarCalibracao(ponderadas)
  const recente = rodadas[rodadas.length - 1]
  const desvios = recente
    .map((c) => {
      const media = estimativaMedia(modelo, c)
      return media && ([c.alvoPx[0] - media[0], c.alvoPx[1] - media[1]] as Ponto)
    })
    .filter((d): d is Ponto => d !== null)
  if (desvios.length === 0) return modelo
  // Corrige o que é comum aos pontos: a mediana de cada eixo ignora um ponto que destoa. Com um só
  // ponto (primeiro clique), já desloca por ele; os cliques seguintes refinam.
  return modelo.comCorrecao([mediana(desvios.map((d) => d[0])), mediana(desvios.map((d) => d[1]))])
}

export const qualidadeDoErro = (erroPx: number, diagonalPx: number) =>
  Math.round(Math.max(0, 1 - erroPx / (0.25 * diagonalPx)) * 1000) / 1000

export function coberturaDe(coletas: ColetaPonto[]): number {
  const frames = coletas.reduce((s, c) => s + c.frames, 0)
  return frames ? Math.round((coletas.reduce((s, c) => s + c.amostras.length, 0) / frames) * 1000) / 1000 : 0
}

// --- Conferência depois da calibração ("a bolinha está onde você olha?") ---------------------

/** Rodadas automáticas de ajuste; depois disso a pessoa ainda pode pedir mais. */
export const MAX_RODADAS_CONFERENCIA = 3

/** Erro aceito em cada ponto da conferência: 4,5% da diagonal da tela, no mínimo 50 px. */
export const limiteConferenciaPx = (diagonalPx: number) => Math.max(50, 0.045 * diagonalPx)

export interface RodadaConferencia {
  /** Erro de cada ponto (px), ou null se o ponto ficou sem leituras. */
  erros: (number | null)[]
  erroMedioPx: number | null
  /** Todos os pontos medidos dentro do limite (e pelo menos 3 medidos). */
  aprovada: boolean
}

export function avaliarRodada(modelo: MapeamentoOlhar, coletas: ColetaPonto[], limitePx: number): RodadaConferencia {
  const erros = coletas.map((c) => medirColeta(modelo, c))
  const medidos = erros.filter((e): e is number => e !== null)
  return {
    erros,
    erroMedioPx: medidos.length ? Math.round((medidos.reduce((a, b) => a + b, 0) / medidos.length) * 10) / 10 : null,
    aprovada: medidos.length >= 3 && medidos.every((e) => e <= limitePx),
  }
}

/**
 * Resultado final da calibração, quando a pessoa confirma que a bolinha acompanha o olhar.
 * O erro vem da última rodada de conferência (pontos fora da calibração inicial).
 */
export function concluirCalibracao(
  modelo: MapeamentoOlhar,
  coletas: ColetaPonto[],
  erroMedioPx: number | null,
  diagonalPx: number,
): ResultadoCalibracao {
  return {
    modelo,
    pontos: coletas.filter((c) => c.amostras.length >= MIN_AMOSTRAS).length,
    erroMedioPx: erroMedioPx === null ? null : Math.round(erroMedioPx * 10) / 10,
    qualidade: erroMedioPx === null ? null : qualidadeDoErro(erroMedioPx, diagonalPx),
    coberturaValida: coberturaDe(coletas),
    distanciaMediaCm: distanciaMediana(coletas),
    fracaoReflexo: fracaoReflexo(coletas),
  }
}

function distanciaMediana(coletas: ColetaPonto[]): number | null {
  const distancias = coletas.flatMap((c) => c.amostras.map((a) => a.pose.distanciaCm))
  return distancias.length ? Math.round(mediana(distancias) * 10) / 10 : null
}

function fracaoReflexo(coletas: ColetaPonto[]): number {
  const frames = coletas.reduce((s, c) => s + c.frames, 0)
  return frames ? Math.round((coletas.reduce((s, c) => s + c.framesComReflexo, 0) / frames) * 1000) / 1000 : 0
}
