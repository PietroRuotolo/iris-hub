'use client'

import { useEffect, useRef, useState } from 'react'
import type { Ponto } from '@/features/rastreamento-ocular/features'
import { ESTADO_LIVRE, avisoDaPausa, estaPausado, passoPausa, type AvisoPausa, type EstadoPausa } from '@/features/rastreamento-ocular/pausa'
import { desvioDaPose, type Pose } from '@/features/rastreamento-ocular/pose'
import { MENSAGEM_PROBLEMA } from '@/features/rastreamento-ocular/qualidade'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import type { ColetaPonto } from './calibrar'
import type { PontoTela } from './pontos'

/** Tempo para o olho chegar ao alvo (descartado) e tempo de coleta em cada alvo. */
export const ACOMODACAO_MS = 800
export const COLETA_MS = 1200
/**
 * Na calibração, a cabeça virada mais do que isso (em relação ao começo da sequência) pausa. Distância e
 * posição não pausam aqui: a leitura fora da faixa só não conta, como antes.
 */
export const GIRO_PAUSA_CALIBRACAO_GRAUS = 12
const LIMITES_CALIBRACAO = { distancia: Number.POSITIVE_INFINITY, rotacaoGraus: GIRO_PAUSA_CALIBRACAO_GRAUS, posicao: Number.POSITIVE_INFINITY }

/**
 * Conduz a pessoa por uma sequência de alvos, coletando `lerLeitura()` durante a janela de coleta
 * de cada um. Com os olhos fechados (piscada) ou a cabeça virada, o tempo do ponto para (pausa); a
 * piscada em silêncio, e depois de 5 s com aviso (`aviso`). O componente que usa o hook deve ser montado só enquanto a sequência roda: remontar
 * com outra `key` recomeça do zero.
 */
export function useSequenciaDeAlvos(
  pontos: PontoTela[],
  paraPx: (ponto: PontoTela) => Ponto,
  lerLeitura: () => LeituraOlhar,
  aoFinalizar: (coletas: ColetaPonto[]) => void,
  tempos: { acomodacaoMs: number; coletaMs: number } = { acomodacaoMs: ACOMODACAO_MS, coletaMs: COLETA_MS },
) {
  const [indice, setIndice] = useState(0)
  const [progresso, setProgresso] = useState(0)
  const [progressoColeta, setProgressoColeta] = useState(0)
  const coletasRef = useRef<ColetaPonto[]>([])
  const [aviso, setAviso] = useState<AvisoPausa | null>(null)
  // A pausa e a posição da cabeça de referência atravessam os pontos da sequência.
  const pausaRef = useRef<EstadoPausa>(ESTADO_LIVRE)
  const referenciaRef = useRef<Pose | null>(null)
  const callbacks = useRef({ paraPx, lerLeitura, aoFinalizar })

  useEffect(() => {
    callbacks.current = { paraPx, lerLeitura, aoFinalizar }
  })

  useEffect(() => {
    if (indice >= pontos.length) return
    const ponto = pontos[indice]
    const coleta: ColetaPonto = { ponto, alvoPx: callbacks.current.paraPx(ponto), amostras: [], frames: 0, problemas: {}, framesComReflexo: 0 }
    const inicio = performance.now()
    let ultimoQuadro = -1
    let frameId = 0
    // Tempo parado neste ponto (pausas já encerradas), descontado do relógio do ponto.
    let parado = 0
    let pausaDesde: number | null = estaPausado(pausaRef.current) ? inicio : null

    const loop = () => {
      const agora = performance.now()
      const leitura = callbacks.current.lerLeitura()
      const novoQuadro = leitura.quadro !== ultimoQuadro
      if (novoQuadro) {
        if (!referenciaRef.current && leitura.features) referenciaRef.current = leitura.features.pose
        const desvio = leitura.pose && referenciaRef.current ? desvioDaPose(leitura.pose, referenciaRef.current, LIMITES_CALIBRACAO) : null
        const passo = passoPausa(pausaRef.current, { agora, olhosFechados: leitura.problemas.includes('piscada'), desvio, falha: null })
        pausaRef.current = passo.estado
        if (passo.eventos.some((e) => e.tipo === 'pausou')) pausaDesde = agora
        if (passo.eventos.some((e) => e.tipo === 'retomou') && pausaDesde !== null) {
          parado += agora - pausaDesde
          pausaDesde = null
        }
        // Só re-renderiza quando o aviso muda (não a cada frame).
        const novo = avisoDaPausa(pausaRef.current, agora, (f) => MENSAGEM_PROBLEMA[f], 'Calibração pausada')
        setAviso((atual) => (atual?.titulo === novo?.titulo && atual?.texto === novo?.texto ? atual : novo))
      }
      if (estaPausado(pausaRef.current)) {
        if (novoQuadro) ultimoQuadro = leitura.quadro
        frameId = requestAnimationFrame(loop)
        return
      }

      const decorrido = agora - inicio - parado
      if (decorrido < tempos.acomodacaoMs) {
        setProgresso(decorrido / tempos.acomodacaoMs)
        setProgressoColeta(0)
      } else if (decorrido < tempos.acomodacaoMs + tempos.coletaMs) {
        setProgresso(1)
        setProgressoColeta((decorrido - tempos.acomodacaoMs) / tempos.coletaMs)
        const { features, problemas, reflexo } = leitura
        // Conta cada frame da câmera uma vez só (a tela pode desenhar mais rápido que a câmera).
        // Só leituras sem problema entram; os problemas ficam contados para explicar uma falha.
        if (novoQuadro) {
          coleta.frames++
          if (features) coleta.amostras.push(features)
          for (const p of problemas) coleta.problemas[p] = (coleta.problemas[p] ?? 0) + 1
          if (reflexo) coleta.framesComReflexo++
        }
      } else {
        coletasRef.current = [...coletasRef.current, coleta]
        if (novoQuadro) ultimoQuadro = leitura.quadro
        if (indice + 1 >= pontos.length) callbacks.current.aoFinalizar(coletasRef.current)
        else setIndice(indice + 1)
        return
      }
      if (novoQuadro) ultimoQuadro = leitura.quadro
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [indice, pontos, tempos.acomodacaoMs, tempos.coletaMs])

  return {
    ponto: pontos[indice] as PontoTela | undefined,
    indice,
    total: pontos.length,
    progresso,
    coletando: progresso >= 1,
    progressoColeta,
    /** Aviso da pausa (cabeça virada, ou olhos fechados por mais de 5 s); null sem pausa visível. */
    aviso,
  }
}
