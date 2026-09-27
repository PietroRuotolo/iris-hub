// Regra de acerto de um alvo. Acerto: com o olhar válido, entrar no alvo dentro da janela em torno
// da batida e ficar nele por pelo menos a permanência mínima. Sem olhar suficiente durante o alvo,
// a tentativa é "rastreamento insuficiente" (não conta como erro). Lógica pura, testável.

import type { ResultadoTentativa } from '@iris/contracts'
import type { Ponto } from '@/features/rastreamento-ocular/features'

/** Uma leitura do olhar na tela (px), ou null sem rosto/piscada. t em ms (performance.now). */
export interface AmostraOlhar {
  t: number
  ponto: Ponto | null
}

export interface AlvoEmJogo {
  cx: number
  cy: number
  raio: number
  apareceEm: number
  batidaEm: number
  janelaMs: number
  permanenciaMinMs: number
}

export interface Avaliacao {
  resultado: ResultadoTentativa
  entradaEm: number | null
  latenciaMs: number | null
  erroTempoMs: number | null
  erroEspacial: number | null
  permanenciaMs: number | null
  cobertura: number
  /** Desvio médio do olhar em relação ao centro do alvo na janela da batida (px; + = direita/baixo). */
  desvioXPx: number | null
  desvioYPx: number | null
}

/** Falhas curtas de leitura (uma piscada) não interrompem a permanência. */
export const TOLERANCIA_FALHA_MS = 150
/** Abaixo desta fração de leituras válidas, o alvo não pode ser avaliado. */
export const COBERTURA_MINIMA = 0.5

/** Fim do período avaliado de um alvo: o alvo some neste momento. */
export const fimDoAlvo = (alvo: AlvoEmJogo) => alvo.batidaEm + alvo.janelaMs

export function avaliarAlvo(alvo: AlvoEmJogo, amostras: AmostraOlhar[]): Avaliacao {
  const { cx, cy, raio, apareceEm, batidaEm, janelaMs, permanenciaMinMs } = alvo
  const inicioJanela = batidaEm - janelaMs
  const fim = fimDoAlvo(alvo)
  const periodo = amostras.filter((a) => a.t >= apareceEm && a.t <= fim)
  const cobertura = periodo.length ? periodo.filter((a) => a.ponto).length / periodo.length : 0
  const naJanela = periodo.flatMap((a) => (a.ponto && a.t >= inicioJanela ? [a.ponto] : []))
  const desvioXPx = naJanela.length ? Math.round(naJanela.reduce((s, p) => s + p[0] - cx, 0) / naJanela.length) : null
  const desvioYPx = naJanela.length ? Math.round(naJanela.reduce((s, p) => s + p[1] - cy, 0) / naJanela.length) : null

  let inicio: number | null = null // começo da sequência atual com o olhar dentro do alvo
  let ultimaDentro = 0
  let dentro: { t: number; d: number }[] = []
  let entrada: number | null = null
  let saida: number | null = null

  for (const a of periodo) {
    if (!a.ponto) {
      if (inicio !== null && a.t - ultimaDentro > TOLERANCIA_FALHA_MS) {
        if (entrada !== null) break
        inicio = null
      }
      continue
    }
    const d = Math.hypot(a.ponto[0] - cx, a.ponto[1] - cy)
    if (d > raio) {
      if (entrada !== null) {
        saida = a.t
        break
      }
      inicio = null
      continue
    }
    if (inicio === null) {
      inicio = a.t
      dentro = []
    }
    ultimaDentro = a.t
    dentro.push({ t: a.t, d })
    // Quem já estava olhando antes da janela conta como entrada no começo da janela.
    const entradaEfetiva = Math.max(inicio, inicioJanela)
    if (entrada === null && entradaEfetiva <= fim && a.t - entradaEfetiva >= permanenciaMinMs) entrada = entradaEfetiva
  }

  if (entrada === null) {
    return {
      resultado: cobertura < COBERTURA_MINIMA ? 'RASTREAMENTO_INSUFICIENTE' : 'SEM_RESPOSTA',
      entradaEm: null,
      latenciaMs: null,
      erroTempoMs: null,
      erroEspacial: null,
      permanenciaMs: null,
      cobertura: arredondar(cobertura, 3),
      desvioXPx,
      desvioYPx,
    }
  }

  const naPermanencia = dentro.filter((p) => p.t >= entrada && p.t <= entrada + permanenciaMinMs)
  const distanciaMedia = naPermanencia.reduce((s, p) => s + p.d, 0) / naPermanencia.length
  return {
    resultado: 'ACERTO',
    entradaEm: entrada,
    latenciaMs: Math.round(entrada - apareceEm),
    erroTempoMs: Math.round(Math.abs(entrada - batidaEm)),
    erroEspacial: arredondar(distanciaMedia / raio, 3),
    permanenciaMs: Math.round((saida ?? ultimaDentro) - entrada),
    cobertura: arredondar(cobertura, 3),
    desvioXPx,
    desvioYPx,
  }
}

/** Olhar parado: todas as leituras a até esta distância (px) da média, por pelo menos este tempo. */
export const FIXACAO_RAIO_PX = 40
export const FIXACAO_MIN_MS = 200
/** Até quantos raios do alvo uma fixação ainda conta como "olhando para ele". */
export const FIXACAO_ALCANCE_RAIOS = 2.5

/**
 * Fixação do olhar mais perto do alvo enquanto ele esteve na tela: um trecho em que o olhar ficou
 * parado (todas as leituras perto da média) por pelo menos FIXACAO_MIN_MS. Se estiver a até
 * FIXACAO_ALCANCE_RAIOS raios do centro, é quase certo que a pessoa olhava para o alvo, e a
 * diferença mostra o desalinhamento da calibração. null se não houve fixação perto.
 */
export function fixacaoPerto(alvo: AlvoEmJogo, amostras: AmostraOlhar[]): Ponto | null {
  const pontos = amostras.filter((a): a is { t: number; ponto: Ponto } => !!a.ponto && a.t >= alvo.apareceEm + 150 && a.t <= fimDoAlvo(alvo))
  let melhor: { ponto: Ponto; distancia: number } | null = null
  let inicio = 0
  for (let fim = 0; fim < pontos.length; fim++) {
    // Encolhe o trecho pelo começo até todas as leituras ficarem perto da média.
    for (;;) {
      const trecho = pontos.slice(inicio, fim + 1)
      const media: Ponto = [trecho.reduce((s, a) => s + a.ponto[0], 0) / trecho.length, trecho.reduce((s, a) => s + a.ponto[1], 0) / trecho.length]
      if (trecho.every((a) => Math.hypot(a.ponto[0] - media[0], a.ponto[1] - media[1]) <= FIXACAO_RAIO_PX)) {
        if (pontos[fim].t - pontos[inicio].t >= FIXACAO_MIN_MS) {
          const distancia = Math.hypot(media[0] - alvo.cx, media[1] - alvo.cy)
          if (!melhor || distancia < melhor.distancia) melhor = { ponto: media, distancia }
        }
        break
      }
      inicio++
    }
  }
  return melhor && melhor.distancia <= FIXACAO_ALCANCE_RAIOS * alvo.raio ? melhor.ponto : null
}

function arredondar(valor: number, casas: number) {
  const f = 10 ** casas
  return Math.round(valor * f) / f
}
