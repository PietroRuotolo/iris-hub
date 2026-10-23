'use client'

import { useEffect, useRef, useState } from 'react'
import { manterNaTela, type PontoNaTela } from '@/features/rastreamento-ocular/bordas'
import { criarSuavizador, type MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'

// A bolinha que mostra onde o sistema acha que a pessoa está olhando (mesma do jogo). Nunca sai da tela:
// com o olhar estimado fora dela, fica vazada na borda. O ajuste por clique usa o olhar de verdade.
const RAIO = 14

export default function BolinhaOlhar({ modelo, lerLeitura }: { modelo: MapeamentoOlhar; lerLeitura: () => LeituraOlhar }) {
  const [olhar, setOlhar] = useState<PontoNaTela | null>(null)
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
        const estimado = suavizar(features ? props.current.modelo.prever(features) : null, performance.now())
        setOlhar(manterNaTela(estimado, { largura: window.innerWidth, altura: window.innerHeight }, RAIO))
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  if (!olhar) return null
  return (
    <svg className="pointer-events-none fixed inset-0 z-10 h-full w-full" aria-hidden="true">
      <circle
        cx={olhar.ponto[0]}
        cy={olhar.ponto[1]}
        r={RAIO}
        fill="var(--color-navy)"
        fillOpacity={olhar.fora ? 0 : 0.3}
        stroke="var(--color-navy)"
        strokeOpacity={olhar.fora ? 0.9 : 0.6}
        strokeWidth={2}
        strokeDasharray={olhar.fora ? '4 3' : undefined}
      />
    </svg>
  )
}
