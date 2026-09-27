'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Square } from 'lucide-react'
import type { ConfigFase } from '../fases'

/** Sem escolha nesse tempo, o jogo continua sozinho. */
export const TEMPO_ESCOLHA_MS = 5000

const RAIO = 22
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

// Antes de cada fase: número e nome da fase, pontos até agora e a escolha entre continuar e parar.
export default function ModalFase({
  config,
  total,
  pontosAteAgora,
  aoContinuar,
  aoParar,
}: {
  config: ConfigFase
  total: number
  pontosAteAgora: number
  aoContinuar: () => void
  aoParar: () => void
}) {
  const [restanteMs, setRestanteMs] = useState(TEMPO_ESCOLHA_MS)
  const escolhido = useRef(false)
  const acoes = useRef({ aoContinuar, aoParar })

  useEffect(() => {
    acoes.current = { aoContinuar, aoParar }
  })

  function escolher(acao: 'aoContinuar' | 'aoParar') {
    if (escolhido.current) return
    escolhido.current = true
    acoes.current[acao]()
  }

  useEffect(() => {
    const inicio = performance.now()
    const id = setInterval(() => {
      const restante = Math.max(0, TEMPO_ESCOLHA_MS - (performance.now() - inicio))
      setRestanteMs(restante)
      if (restante === 0) {
        clearInterval(id)
        if (!escolhido.current) {
          escolhido.current = true
          acoes.current.aoContinuar()
        }
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  const segundos = Math.ceil(restanteMs / 1000)

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-navy/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-fase"
        className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] p-6 text-center shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-warn)]">
          Fase {config.fase} de {total}
        </p>
        <h2 id="titulo-fase" className="mt-2 font-display text-3xl font-semibold text-[var(--color-navy)]">
          {config.nome}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{config.descricao}</p>

        <div className="mt-5 rounded-xl bg-[var(--color-bg)] px-4 py-3">
          <p className="font-display text-3xl font-semibold text-[var(--color-ink)]">{Math.round(pontosAteAgora)}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">pontos até agora</p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3" aria-live="polite">
          <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90" aria-hidden="true">
            <circle cx="26" cy="26" r={RAIO} fill="none" stroke="var(--color-warn-bg)" strokeWidth="4" />
            <circle
              cx="26"
              cy="26"
              r={RAIO}
              fill="none"
              stroke="var(--color-warn)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={CIRCUNFERENCIA * (1 - restanteMs / TEMPO_ESCOLHA_MS)}
            />
          </svg>
          <p className="text-left text-sm text-[var(--color-ink)]">
            Continua sozinho em <strong>{segundos}s</strong>
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            autoFocus
            onClick={() => escolher('aoContinuar')}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            <Play size={18} /> Continuar
          </button>
          <button
            type="button"
            onClick={() => escolher('aoParar')}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-bg)] px-4 py-3 text-base font-semibold text-[var(--color-ink)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            <Square size={16} /> Parar
          </button>
        </div>
      </div>
    </div>
  )
}
