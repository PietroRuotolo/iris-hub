'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { classificarTempo, ROTULO_FAIXA} from '../reflexo'

type Estado = 'aguardando' | 'esperando' | 'pronto' | 'cedo' | 'resultado'

export default function TelaReflexo() {
  const [estado, setEstado] = useState<Estado>('aguardando')
  const [tempoMs, setTempoMs] = useState<number | null>(null)
  const inicioRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const limparTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const comecar = useCallback(() => {
    limparTimeout()
    setTempoMs(null)
    setEstado('esperando')
    timeoutRef.current = setTimeout(() => {
      inicioRef.current = performance.now()
      setEstado('pronto')
    }, )
  }, [limparTimeout])

  useEffect(() => {
    return () => limparTimeout()
  }, [limparTimeout])

  const aoClicar = () => {
    if (estado === 'aguardando' || estado === 'resultado' || estado === 'cedo') {
      comecar()
      return
    }
    if (estado === 'esperando') {
      limparTimeout()
      setEstado('cedo')
      return
    }
    if (estado === 'pronto') {
      setTempoMs(Math.round(performance.now() - inicioRef.current))
      setEstado('resultado')
    }
  }

  const corFundo =
    estado === 'pronto'
      ? 'bg-[var(--color-good)] text-[var(--color-surface)]'
      : estado === 'cedo'
        ? 'bg-[var(--color-warn)] text-[var(--color-surface)]'
        : 'bg-[var(--color-surface)] text-[var(--color-navy)]'

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-6">
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">
        Teste de reflexo
      </h1>
      <p className="max-w-md text-center text-sm text-[var(--color-ink-soft)]">
        Clique no quadrado para começar, aguarde a área ficar verde e clique o mais rápido possível.
      </p>

      <button
        type="button"
        onClick={aoClicar}
        className={`flex h-64 w-64 cursor-pointer flex-col items-center justify-center rounded-2xl text-center text-lg font-semibold shadow-sm outline-none transition select-none ${corFundo}`}
      >
        {estado === 'aguardando' && 'Começar'}
        {estado === 'esperando' && 'Espere...'}
        {estado === 'pronto' && 'Clique!'}
        {estado === 'cedo' && (
          <>
            Cedo demais
            <span className="text-sm font-normal">clique para tentar de novo</span>
          </>
        )}
        {estado === 'resultado' && tempoMs !== null && (
          <>
            {tempoMs} ms
            <span className="text-sm font-normal">{ROTULO_FAIXA[classificarTempo(tempoMs)]}</span>
            <span className="text-xs font-normal underline">tentar de novo</span>
          </>
        )}
      </button>
    </div>
  )
}