'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import type { FeaturesOlhar } from '@/features/rastreamento-ocular/features'
import { MENSAGEM_PROBLEMA, type Problema } from '@/features/rastreamento-ocular/qualidade'
import type { MapeamentoOlhar } from '@/features/rastreamento-ocular/mapeamento'
import type { LeituraOlhar } from '@/lib/mediapipe/useFaceLandmarker'
import { medirColeta, type ColetaPonto } from '../calibrar'
import { paraPixels, type Layout } from '../layout'
import { PONTOS_CALIBRACAO } from '../pontos'
import BolinhaOlhar from './BolinhaOlhar'

/** Leituras usadas em cada clique: o olhar do meio segundo antes do clique (o olho já está no marcador). */
const JANELA_CLIQUE_MS = 550
const IGNORAR_FINAL_MS = 50
const MIN_LEITURAS_CLIQUE = 6
/** Espaço da barra de botões, embaixo, que os marcadores não podem ocupar. */
const ALTURA_BARRA = 110

type EstadoMarcador = { erroPx: number; ok: boolean } | undefined

// Antes da Fase 1: "A calibração está boa?". A pessoa mexe os olhos e vê se a bolinha acompanha.
// Se não, olha para um marcador e clica nele: o olhar daquele instante vira um ponto de calibração
// (a pessoa olha para onde clica) e o modelo se ajusta na hora. Repete até ficar bom.
export default function TelaOlharLivre({
  modelo,
  lerLeitura,
  layout,
  limitePx,
  ajustes,
  aoAjustar,
  aoConfirmar,
  aoRecalibrar,
}: {
  modelo: MapeamentoOlhar
  lerLeitura: () => LeituraOlhar
  layout: Layout
  /** Distância aceita entre a bolinha e o marcador. */
  limitePx: number
  /** Quantos ajustes por clique já foram feitos. */
  ajustes: number
  aoAjustar: (coleta: ColetaPonto, erroAntesPx: number) => void
  aoConfirmar: () => void
  aoRecalibrar: () => void
}) {
  const [marcadores, setMarcadores] = useState<EstadoMarcador[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const leituras = useRef<{ t: number; features: FeaturesOlhar | null; problemas: Problema[]; reflexo: boolean }[]>([])
  const lerRef = useRef(lerLeitura)

  useEffect(() => {
    lerRef.current = lerLeitura
  })

  // Guarda as leituras dos últimos 2 s, para saber para onde o olho apontava no momento do clique.
  useEffect(() => {
    let ultimoQuadro = -1
    let frameId = 0
    const loop = () => {
      const { features, problemas, reflexo, quadro } = lerRef.current()
      const agora = performance.now()
      if (quadro !== ultimoQuadro) {
        ultimoQuadro = quadro
        leituras.current.push({ t: agora, features, problemas, reflexo })
        while (leituras.current.length && leituras.current[0].t < agora - 2000) leituras.current.shift()
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const area = { ...layout.areaAlvos, altura: layout.areaAlvos.altura - ALTURA_BARRA }
  const posicoes = PONTOS_CALIBRACAO.map((p) => paraPixels(p, area))

  /** agora: horário do clique (event.timeStamp, mesma escala do performance.now das leituras). */
  function clicar(indice: number, agora: number) {
    const janela = leituras.current.filter((l) => l.t >= agora - JANELA_CLIQUE_MS && l.t <= agora - IGNORAR_FINAL_MS)
    const amostras = janela.flatMap((l) => (l.features ? [l.features] : []))
    const problemas: Partial<Record<Problema, number>> = {}
    for (const l of janela) for (const p of l.problemas) problemas[p] = (problemas[p] ?? 0) + 1
    if (amostras.length < MIN_LEITURAS_CLIQUE) {
      const [principal] = (Object.entries(problemas) as [Problema, number][]).filter(([p]) => p !== 'piscada').sort((a, b) => b[1] - a[1])[0] ?? []
      setAviso(
        `Não deu para ler o seu olhar nesse clique${principal ? ` (${MENSAGEM_PROBLEMA[principal].toLowerCase().replace(/\.$/, '')})` : ''}. Olhe para o marcador, espere um instante e clique de novo.`,
      )
      return
    }
    const coleta: ColetaPonto = { ponto: PONTOS_CALIBRACAO[indice], alvoPx: posicoes[indice], amostras, frames: janela.length, problemas, framesComReflexo: janela.filter((l) => l.reflexo).length }
    const erroPx = medirColeta(modelo, coleta) ?? 0
    setMarcadores((m) => {
      const novo = [...m]
      novo[indice] = { erroPx, ok: erroPx <= limitePx }
      return novo
    })
    setAviso(null)
    aoAjustar(coleta, erroPx)
  }

  return (
    <>
      <div
        className="fixed flex flex-col items-center justify-center gap-1 text-center"
        style={{ left: layout.cabecalho.x, top: layout.cabecalho.y, width: layout.cabecalho.largura, height: layout.cabecalho.altura }}
      >
        <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">A calibração está boa?</h1>
        <p className="text-sm text-[var(--color-ink)]">
          Mexa os olhos pela tela e veja se a bolinha acompanha. Mexa um pouco a cabeça também (mais perto, mais longe,
          para os lados).
        </p>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Se ficar longe, <strong className="text-[var(--color-ink)]">olhe para um marcador e clique nele</strong>: a
          calibração se ajusta a cada clique.
        </p>
      </div>

      {posicoes.map(([x, y], i) => {
        const estado = marcadores[i]
        const cor = !estado ? 'var(--color-warn)' : estado.ok ? 'var(--color-good)' : 'var(--color-warn)'
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => clicar(i, e.timeStamp)}
            aria-label={`Marcador ${i + 1}: olhe para ele e clique para ajustar`}
            className="fixed z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 bg-[var(--color-surface)]/60 outline-none transition hover:bg-[var(--color-surface)] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
            style={{ left: x, top: y, borderColor: cor }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} />
            {estado && (
              <span
                className="pointer-events-none absolute top-full mt-1 whitespace-nowrap rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium shadow-sm"
                style={{ color: cor }}
              >
                {estado.ok ? `ok · ${Math.round(estado.erroPx)} px` : `ajustado · estava a ${Math.round(estado.erroPx)} px`}
              </span>
            )}
          </button>
        )
      })}

      <div className="fixed inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2 px-4">
        {aviso && (
          <p role="status" className="max-w-xl rounded-xl bg-[var(--color-warn-bg)] px-4 py-2 text-center text-sm text-[var(--color-ink)]">
            {aviso}
          </p>
        )}
        <div className="flex w-full max-w-xl flex-col items-stretch gap-2 rounded-2xl bg-[var(--color-surface)] p-3 shadow-sm sm:flex-row sm:items-center">
          <p className="px-2 text-sm text-[var(--color-ink-soft)] sm:w-28">
            Ajustes: <strong className="text-[var(--color-ink)]">{ajustes}</strong>
          </p>
          <button
            type="button"
            onClick={aoConfirmar}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2"
          >
            <Check size={18} /> Sim, está boa · começar
          </button>
          <button
            type="button"
            onClick={aoRecalibrar}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-[var(--color-ink-soft)] outline-none hover:bg-[var(--color-bg)] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
          >
            <RotateCcw size={16} /> Recalibrar do zero
          </button>
        </div>
      </div>

      <BolinhaOlhar modelo={modelo} lerLeitura={lerLeitura} />
    </>
  )
}
