'use client'

import { useEffect, useRef, useState } from 'react'
import type { Ponto } from '@/features/rastreamento-ocular/features'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import type { ColetaPonto } from './calibrar'
import type { PontoTela } from './pontos'

/** Tempo para o olho chegar ao alvo (descartado) e tempo de coleta em cada alvo. */
export const ACOMODACAO_MS = 800
export const COLETA_MS = 1200

/**
 * Conduz a pessoa por uma sequência de alvos, coletando `lerLeitura()` durante a janela de coleta
 * de cada um. O componente que usa o hook deve ser montado só enquanto a sequência roda: remontar
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

    const loop = () => {
      const decorrido = performance.now() - inicio
      if (decorrido < tempos.acomodacaoMs) {
        setProgresso(decorrido / tempos.acomodacaoMs)
        setProgressoColeta(0)
      } else if (decorrido < tempos.acomodacaoMs + tempos.coletaMs) {
        setProgresso(1)
        setProgressoColeta((decorrido - tempos.acomodacaoMs) / tempos.coletaMs)
        const { features, problemas, reflexo, quadro } = callbacks.current.lerLeitura()
        // Conta cada frame da câmera uma vez só (a tela pode desenhar mais rápido que a câmera).
        // Só leituras sem problema entram; os problemas ficam contados para explicar uma falha.
        if (quadro !== ultimoQuadro) {
          ultimoQuadro = quadro
          coleta.frames++
          if (features) coleta.amostras.push(features)
          for (const p of problemas) coleta.problemas[p] = (coleta.problemas[p] ?? 0) + 1
          if (reflexo) coleta.framesComReflexo++
        }
      } else {
        coletasRef.current = [...coletasRef.current, coleta]
        if (indice + 1 >= pontos.length) callbacks.current.aoFinalizar(coletasRef.current)
        else setIndice(indice + 1)
        return
      }
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
  }
}
