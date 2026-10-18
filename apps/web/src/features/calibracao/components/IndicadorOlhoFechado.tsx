'use client'

import { useEffect, useRef, useState } from 'react'
import { LIMITE_OLHO_FECHADO } from '@/features/rastreamento-ocular/qualidade'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import type { Retangulo } from '../layout'

// Só em desenvolvimento: a nota de "olho fechado" do MediaPipe, embaixo da prévia da câmera, para
// ajustar LIMITE_OLHO_FECHADO com um rosto de verdade (feche os olhos e veja se passa do limite).
export default function IndicadorOlhoFechado({ lerLeitura, posicao }: { lerLeitura: () => LeituraOlhar; posicao: Retangulo }) {
  const [nota, setNota] = useState<number | null>(null)
  const ler = useRef(lerLeitura)

  useEffect(() => {
    ler.current = lerLeitura
  })

  useEffect(() => {
    let frameId = 0
    let ultimo = -1
    const loop = () => {
      const { olhoFechado } = ler.current()
      const arredondada = olhoFechado === null ? null : Math.round(olhoFechado * 100) / 100
      if (arredondada !== ultimo) {
        ultimo = arredondada ?? -1
        setNota(arredondada)
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const fechado = nota !== null && nota > LIMITE_OLHO_FECHADO
  return (
    <div
      className={`fixed z-10 rounded-xl px-3 py-2 text-xs font-medium shadow-sm ${fechado ? 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]' : 'bg-[var(--color-surface)] text-[var(--color-ink)]'}`}
      style={{ left: posicao.x, top: posicao.y + posicao.altura + 8, width: posicao.largura }}
      aria-hidden="true"
    >
      Olho fechado: <strong className="tabular-nums">{nota === null ? '—' : nota.toFixed(2)}</strong> (limite {LIMITE_OLHO_FECHADO})
      {fechado && ' · FECHADO'}
    </div>
  )
}
