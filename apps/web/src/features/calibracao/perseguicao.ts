// Calibração por perseguição: depois dos 9 pontos fixos, a pessoa segue com os olhos um ponto que anda
// pela tela (zigue-zague horizontal, vertical e diagonais). Dá centenas de posições, inclusive bordas e
// cantos, para o modelo aprender o olhar entre os pontos fixos. Lógica pura (sem câmera nem DOM).
//
// O olho segue um alvo em movimento com um pequeno atraso e, quando perde o ponto, dá um salto para
// alcançá-lo. Por isso: estimamos o atraso de cada pessoa e ligamos cada leitura à posição do ponto
// aquele tempo antes; descartamos os saltos, o começo de cada trecho e as leituras longe do ponto.

import type { FeaturesOlhar, Ponto } from '@/features/rastreamento-ocular/features'
import type { MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import type { LeituraRotulada } from './calibrar'
import type { Retangulo } from './layout'
import type { PontoTela } from './pontos'

/**
 * O caminho do ponto, em posições normalizadas da área dos alvos, sem saltos: três passadas
 * horizontais descendo (zigue-zague), três verticais andando para a esquerda, e as duas diagonais.
 */
export const PERCURSO_PERSEGUICAO: PontoTela[] = [
  // horizontal
  { x: 0.1, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.9, y: 0.5 },
  { x: 0.1, y: 0.5 },
  { x: 0.1, y: 0.9 },
  { x: 0.9, y: 0.9 },
  // vertical
  { x: 0.9, y: 0.1 },
  { x: 0.5, y: 0.1 },
  { x: 0.5, y: 0.9 },
  { x: 0.1, y: 0.9 },
  { x: 0.1, y: 0.1 },
  // diagonais
  { x: 0.9, y: 0.9 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.9 },
]

/** Peso das leituras da perseguição no ajuste (os pontos fixos pesam 1). */
export const PESO_PERSEGUICAO = 0.5
/**
 * Velocidade do ponto, em graus do olhar por segundo. O olho segue um alvo com suavidade até uns 30°/s;
 * 15°/s deixa a etapa em ~30 s numa tela comum sem o olho perder o ponto.
 */
export const VELOCIDADE_GRAUS_S = 15
/** Parado em cada virada, para o olho alcançar o ponto. */
export const PAUSA_VIRADA_MS = 500
/** Descartado no começo de cada trecho: o olho ainda está acelerando atrás do ponto. */
export const DESCARTE_INICIO_TRECHO_MS = 400
/** Atrasos testados ao estimar o do olho (ms). */
export const ATRASO_MAXIMO_MS = 250

/** Velocidade do ponto em px/s: 15°/s convertidos pelo tamanho da tela e pela distância; sem eles, 25% da largura por segundo. */
export function velocidadePxS({ pxPorCm, distanciaCm, larguraPx }: { pxPorCm: number | null; distanciaCm: number | null; larguraPx: number }): number {
  const pelaGeometria = pxPorCm && distanciaCm ? pxPorCm * distanciaCm * Math.tan((VELOCIDADE_GRAUS_S * Math.PI) / 180) : 0.25 * larguraPx
  return Math.min(900, Math.max(200, pelaGeometria))
}

export interface Percurso {
  duracaoMs: number
  /** Quantos trechos (para o progresso). */
  trechos: number
  /** Onde está o ponto no instante t (ms desde o começo), e em que trecho. */
  posicao: (t: number) => { ponto: Ponto; trecho: number; desdeInicioTrechoMs: number; parado: boolean }
}

/** O percurso em px dentro da área dos alvos: cada trecho é uma pausa na virada e depois o movimento. */
export function criarPercurso(area: Retangulo, velocidade: number, pontos: PontoTela[] = PERCURSO_PERSEGUICAO, pausaMs = PAUSA_VIRADA_MS): Percurso {
  const px = pontos.map((p): Ponto => [area.x + p.x * area.largura, area.y + p.y * area.altura])
  const trechos = px.slice(1).map((destino, i) => {
    const origem = px[i]
    const movimentoMs = (Math.hypot(destino[0] - origem[0], destino[1] - origem[1]) / velocidade) * 1000
    return { origem, destino, movimentoMs, duracaoMs: pausaMs + movimentoMs }
  })
  const duracaoMs = trechos.reduce((s, t) => s + t.duracaoMs, 0)

  return {
    duracaoMs,
    trechos: trechos.length,
    posicao(t) {
      let resto = Math.max(0, t)
      for (let i = 0; i < trechos.length; i++) {
        const tr = trechos[i]
        if (resto < tr.duracaoMs || i === trechos.length - 1) {
          if (resto < pausaMs) return { ponto: tr.origem, trecho: i, desdeInicioTrechoMs: resto, parado: true }
          const f = Math.min(1, (resto - pausaMs) / tr.movimentoMs)
          const ponto: Ponto = [tr.origem[0] + (tr.destino[0] - tr.origem[0]) * f, tr.origem[1] + (tr.destino[1] - tr.origem[1]) * f]
          return { ponto, trecho: i, desdeInicioTrechoMs: resto - pausaMs, parado: false }
        }
        resto -= tr.duracaoMs
      }
      return { ponto: px[px.length - 1], trecho: trechos.length - 1, desdeInicioTrechoMs: 0, parado: true }
    },
  }
}

/** Uma leitura da perseguição: o instante no percurso (sem contar as pausas) e o que a câmera leu. */
export interface LeituraPerseguicao {
  t: number
  features: FeaturesOlhar | null
}

const mediana = (valores: number[]) => {
  const o = [...valores].sort((a, b) => a - b)
  return o.length ? o[Math.floor(o.length / 2)] : Infinity
}
const distancia = (a: Ponto, b: Ponto) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * O atraso do olho: com o modelo dos pontos fixos, prevê o olhar e testa atrasos de 0 a 250 ms; fica o
 * que deixa a previsão mais perto do ponto (pela mediana, que ignora os saltos).
 */
export function estimarAtraso(leituras: LeituraPerseguicao[], percurso: Percurso, modelo: MapeamentoOlhar): number {
  const validas = leituras.filter((l): l is { t: number; features: FeaturesOlhar } => l.features !== null && !percurso.posicao(l.t).parado)
  if (validas.length < 10) return 0
  const previstos = modelo.preverVarios(validas.map((l) => l.features))
  let melhor = { atraso: 0, erro: Infinity }
  for (let atraso = 0; atraso <= ATRASO_MAXIMO_MS; atraso += 10) {
    const erro = mediana(validas.map((l, i) => distancia(previstos[i], percurso.posicao(l.t - atraso).ponto)))
    if (erro < melhor.erro) melhor = { atraso, erro }
  }
  return melhor.atraso
}

export interface ResultadoPerseguicao {
  leituras: LeituraRotulada[]
  atrasoMs: number
  /** Quantas leituras sobraram depois da limpeza, de quantas com olho lido. */
  aproveitadas: number
  lidas: number
  medidas: MedidasOlhar
}

/**
 * Liga cada leitura à posição do ponto (com o atraso do olho) e descarta: o começo de cada trecho, as
 * viradas paradas, os saltos (o olhar andando muito mais rápido que o ponto) e as leituras longe demais
 * do ponto (a pessoa não estava seguindo).
 */
export function rotularPerseguicao(
  leituras: LeituraPerseguicao[],
  percurso: Percurso,
  modelo: MapeamentoOlhar,
  { velocidade, diagonalPx }: { velocidade: number; diagonalPx: number },
): ResultadoPerseguicao {
  const atrasoMs = estimarAtraso(leituras, percurso, modelo)
  const comOlho = leituras.filter((l): l is { t: number; features: FeaturesOlhar } => l.features !== null)
  const previstos = modelo.preverVarios(comOlho.map((l) => l.features))
  const longeDemais = 0.25 * diagonalPx

  const rotuladas: LeituraRotulada[] = []
  comOlho.forEach((l, i) => {
    const agora = percurso.posicao(l.t - atrasoMs)
    if (agora.parado || agora.desdeInicioTrechoMs < DESCARTE_INICIO_TRECHO_MS) return
    if (i > 0) {
      const dt = (l.t - comOlho[i - 1].t) / 1000
      // Salto: o olhar previsto andou mais de 3× a velocidade do ponto.
      if (dt > 0 && distancia(previstos[i], previstos[i - 1]) / dt > 3 * velocidade) return
    }
    if (distancia(previstos[i], agora.ponto) > longeDemais) return
    rotuladas.push({ features: l.features, alvoPx: agora.ponto, peso: PESO_PERSEGUICAO })
  })

  return { leituras: rotuladas, atrasoMs, aproveitadas: rotuladas.length, lidas: comOlho.length, medidas: medidasDoOlhar(comOlho.map((l) => l.features)) }
}

/** O que a perseguição mostra de cada pessoa (para acompanhar; ainda não vai para o banco). */
export interface MedidasOlhar {
  /** Quanto a íris andou na horizontal e na vertical (do 5º ao 95º percentil; unidade = largura do olho). */
  alcanceH: number
  alcanceV: number
  /** Alcance horizontal de cada olho e a razão entre eles (1 = iguais). */
  alcanceOlhoDireito: number | null
  alcanceOlhoEsquerdo: number | null
  assimetria: number | null
  /** Quanto a cabeça virou durante as passadas (graus, do 5º ao 95º percentil). */
  giroCabecaGraus: number
  /** A cabeça acompanhou o ponto (girou mais de 6°): a pessoa deveria mexer só os olhos. */
  cabecaAcompanhou: boolean
}

const faixa = (valores: number[]) => {
  if (valores.length < 2) return 0
  const o = [...valores].sort((a, b) => a - b)
  return o[Math.floor(0.95 * (o.length - 1))] - o[Math.floor(0.05 * (o.length - 1))]
}

export function medidasDoOlhar(features: FeaturesOlhar[]): MedidasOlhar {
  const direito = features.flatMap((f) => (f.porOlho ? [f.porOlho.direito[0]] : []))
  const esquerdo = features.flatMap((f) => (f.porOlho ? [f.porOlho.esquerdo[0]] : []))
  const alcanceOlhoDireito = direito.length > 1 ? faixa(direito) : null
  const alcanceOlhoEsquerdo = esquerdo.length > 1 ? faixa(esquerdo) : null
  const giro = Math.max(faixa(features.map((f) => f.pose.yawGraus)), faixa(features.map((f) => f.pose.pitchGraus)))
  return {
    alcanceH: faixa(features.map((f) => f.h)),
    alcanceV: faixa(features.map((f) => f.v)),
    alcanceOlhoDireito,
    alcanceOlhoEsquerdo,
    assimetria: alcanceOlhoDireito && alcanceOlhoEsquerdo ? alcanceOlhoDireito / alcanceOlhoEsquerdo : null,
    giroCabecaGraus: giro,
    cabecaAcompanhou: giro > 6,
  }
}
