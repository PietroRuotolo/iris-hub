'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Glasses, XCircle } from 'lucide-react'
import { checklistPosicionamento, type ItemChecklist } from '@/features/rastreamento-ocular/qualidade'
import type { Caixa, LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'

/** Tudo certo por esse tempo e a calibração começa sozinha. */
const TUDO_CERTO_MS = 1500
/** Depois desse tempo aparece "Começar mesmo assim" (para não travar quem não consegue resolver algo). */
const LIBERAR_PULAR_MS = 8000

interface Estado {
  itens: ItemChecklist[]
  oculos: boolean | null
  reflexo: { esquerdo: boolean; direito: boolean }
  progresso: number
  podePular: boolean
}

// Antes da calibração: checklist ao vivo de distância, posição, cabeça, luz e reflexo nos olhos,
// com os dois olhos ampliados. A calibração só começa quando tudo fica verde.
export default function Posicionamento({
  videoRef,
  lerLeitura,
  aoPronto,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  lerLeitura: () => LeituraOlhar
  aoPronto: () => void
}) {
  const [estado, setEstado] = useState<Estado | null>(null)
  const olhoDireito = useRef<HTMLCanvasElement>(null)
  const olhoEsquerdo = useRef<HTMLCanvasElement>(null)
  const props = useRef({ lerLeitura, aoPronto })

  useEffect(() => {
    props.current = { lerLeitura, aoPronto }
  })

  useEffect(() => {
    const inicio = performance.now()
    let tudoCertoDesde: number | null = null
    let terminou = false
    let frameId = 0

    const desenharOlho = (canvas: HTMLCanvasElement | null, caixa: Caixa | undefined) => {
      const video = videoRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx || !video || !caixa || video.readyState < 2) return
      // Espelhado, como a prévia da câmera: parece um espelho para a pessoa.
      ctx.save()
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, caixa.x, caixa.y, caixa.largura, caixa.altura, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    const loop = () => {
      const agora = performance.now()
      const leitura = props.current.lerLeitura()
      const itens = checklistPosicionamento(leitura.pose, leitura.ambiente.luz, leitura.pose ? leitura.ambiente.reflexo : null)
      const tudoCerto = itens.length > 1 && itens.every((i) => i.ok)
      tudoCertoDesde = tudoCerto ? (tudoCertoDesde ?? agora) : null
      const progresso = tudoCertoDesde === null ? 0 : Math.min(1, (agora - tudoCertoDesde) / TUDO_CERTO_MS)

      // A imagem é espelhada: o olho direito da pessoa aparece à direita.
      desenharOlho(olhoDireito.current, leitura.olhos?.direito)
      desenharOlho(olhoEsquerdo.current, leitura.olhos?.esquerdo)

      setEstado({
        itens,
        oculos: leitura.ambiente.oculos,
        reflexo: leitura.ambiente.reflexo,
        progresso,
        podePular: agora - inicio > LIBERAR_PULAR_MS,
      })
      if (progresso >= 1 && !terminou) {
        terminou = true
        props.current.aoPronto()
        return
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [videoRef])

  const tudoCerto = !!estado && estado.progresso > 0

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-4 py-6">
      <Link href="/jogo" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Posicione-se</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        A calibração começa sozinha quando tudo estiver verde. Depois, mantenha essa posição durante o jogo.
      </p>

      <div className="mt-4 grid gap-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm lg:grid-cols-[1fr_auto]">
        <ul className="space-y-3" aria-live="polite">
          {(estado?.itens ?? []).map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              {item.ok ? (
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[var(--color-good)]" />
              ) : (
                <XCircle size={20} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
              )}
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{item.titulo}</p>
                <p className={`text-sm ${item.ok ? 'text-[var(--color-ink-soft)]' : 'text-[var(--color-warn)]'}`}>{item.detalhe}</p>
              </div>
            </li>
          ))}
          {estado?.oculos && (
            <li className="flex items-start gap-3">
              <Glasses size={20} className="mt-0.5 shrink-0 text-[var(--color-navy)]" />
              <p className="text-sm text-[var(--color-ink-soft)]">
                Parece que você usa óculos. Tudo bem: só confira se não há reflexo nas lentes (veja os olhos ao lado).
              </p>
            </li>
          )}
        </ul>

        <div className="flex gap-3 lg:flex-col">
          {(
            [
              ['Olho esquerdo', olhoEsquerdo, estado?.reflexo.esquerdo],
              ['Olho direito', olhoDireito, estado?.reflexo.direito],
            ] as const
          ).map(([rotulo, ref, reflexo]) => (
            <figure key={rotulo} className="flex-1">
              <canvas
                ref={ref}
                width={192}
                height={132}
                className={`w-full max-w-48 rounded-xl border-2 bg-[var(--color-navy)] ${reflexo ? 'border-[var(--color-warn)]' : 'border-transparent'}`}
              />
              <figcaption className={`mt-1 text-xs ${reflexo ? 'font-semibold text-[var(--color-warn)]' : 'text-[var(--color-ink-soft)]'}`}>
                {rotulo}
                {reflexo ? ' · reflexo' : ''}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="h-2 w-full overflow-hidden rounded-full bg-navy/10 sm:w-48">
            <div className="h-full rounded-full bg-[var(--color-good)] transition-[width]" style={{ width: `${(estado?.progresso ?? 0) * 100}%` }} />
          </div>
          <p className="shrink-0 text-sm text-[var(--color-ink-soft)]">{tudoCerto ? 'Tudo certo, começando…' : 'Ajuste o que está em laranja'}</p>
        </div>
        {estado?.podePular && !tudoCerto && (
          <button
            type="button"
            onClick={aoPronto}
            className="cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] underline-offset-2 hover:underline"
          >
            Começar mesmo assim
          </button>
        )}
      </div>
    </div>
  )
}
