'use client'

import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * Botão de ação destrutiva: o primeiro toque pede confirmação, o segundo (em até 4 s) executa.
 * Evita que um toque sem querer encerre a vez de alguém.
 */
export default function BotaoAcao({
  rotulo,
  Icone,
  aoConfirmar,
  className = '',
}: {
  rotulo: string
  Icone?: LucideIcon
  aoConfirmar: () => void
  className?: string
}) {
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (!confirmando) return
    const id = setTimeout(() => setConfirmando(false), 4000)
    return () => clearTimeout(id)
  }, [confirmando])

  return (
    <button
      type="button"
      onClick={() => {
        if (confirmando) {
          setConfirmando(false)
          aoConfirmar()
        } else setConfirmando(true)
      }}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] ${
        confirmando ? 'bg-[var(--color-warn)] text-[var(--color-surface)]' : 'bg-[var(--color-warn-bg)] text-[var(--color-ink)]'
      } ${className}`}
    >
      {Icone && <Icone size={18} />}
      {confirmando ? 'Toque de novo para confirmar' : rotulo}
    </button>
  )
}
