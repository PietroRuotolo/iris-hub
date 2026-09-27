import type { RefObject } from 'react'
import { AudioLines } from 'lucide-react'
import type { StatusCamera } from '@/lib/mediapipe/useFaceLandmarker'
import type { Retangulo } from '../layout'

// Prévia da webcam, fixa no canto direito da faixa do topo, com o selo de detecção de rosto.
export default function CartaoCamera({
  videoRef,
  status,
  erro,
  temRosto,
  posicao,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  status: StatusCamera
  erro: string | null
  temRosto: boolean
  posicao: Retangulo
}) {
  let rodape = 'Carregando modelo…'
  let corRodape = 'bg-[var(--color-ink-soft)]'
  if (status === 'erro') {
    rodape = erro || 'Erro na câmera'
    corRodape = 'bg-[var(--color-warn)]'
  } else if (status === 'pronto') {
    rodape = 'Captura ativa'
    corRodape = 'bg-[var(--color-good)]'
  }

  return (
    <div
      className="fixed z-10 flex flex-col overflow-hidden rounded-2xl bg-[var(--color-navy)] shadow-sm ring-4 ring-[var(--color-surface)]"
      style={{ left: posicao.x, top: posicao.y, width: posicao.largura, height: posicao.altura }}
    >
      <div className="relative aspect-video w-full">
        <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
        {status === 'pronto' && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink)]">
            <span className={`h-2 w-2 rounded-full ${temRosto ? 'bg-[var(--color-good)]' : 'bg-[var(--color-warn)]'}`} />
            {temRosto ? 'Rosto detectado' : 'Rosto não detectado'}
          </span>
        )}
      </div>
      <p className={`flex flex-1 items-center justify-center gap-2 px-3 text-xs font-medium text-[var(--color-surface)] ${corRodape}`}>
        {status === 'pronto' && <AudioLines size={14} />}
        <span className="truncate">{rodape}</span>
      </p>
    </div>
  )
}
