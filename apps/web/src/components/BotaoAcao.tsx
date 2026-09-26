import type { LucideIcon } from 'lucide-react'

// Visual do botão de ação destrutiva (dois toques para confirmar, na versão com funcionalidade).
// Por enquanto só o layout: não executa nada.
export default function BotaoAcao({ rotulo, Icone, className = '' }: { rotulo: string; Icone?: LucideIcon; className?: string }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-warn-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] ${className}`}
    >
      {Icone && <Icone size={18} />}
      {rotulo}
    </button>
  )
}
