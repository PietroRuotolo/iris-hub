'use client'

import { useEffect, useRef, useState } from 'react'
import type { Ponto } from '@/features/rastreamento-ocular/features'
import { criarSuavizador, type MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'

// A bolinha que mostra onde o sistema acha que a pessoa está olhando (mesma do jogo).
export default function BolinhaOlhar({ modelo, lerLeitura }: { modelo: MapeamentoOlhar; lerLeitura: () => LeituraOlhar }) {
  const [olhar, setOlhar] = useState<Ponto | null>(null)
  const props = useRef({ modelo, lerLeitura })

  useEffect(() => {
    props.current = { modelo, lerLeitura }
  })

  useEffect(() => {
    const suavizar = criarSuavizador()
    let ultimoQuadro = -1
    let frameId = 0
    const loop = () => {
      const { features, quadro } = props.current.lerLeitura()
      if (quadro !== ultimoQuadro) {
        ultimoQuadro = quadro
        setOlhar(suavizar(features ? props.current.modelo.prever(features) : null, performance.now()))
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  if (!olhar) return null
  return (
    <svg className="pointer-events-none fixed inset-0 z-10 h-full w-full" aria-hidden="true">
      <circle cx={olhar[0]} cy={olhar[1]} r={14} fill="var(--color-navy)" fillOpacity={0.3} stroke="var(--color-navy)" strokeOpacity={0.6} strokeWidth={2} />
    </svg>
  )
}
