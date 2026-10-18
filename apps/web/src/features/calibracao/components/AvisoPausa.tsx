import { AlertTriangle, PauseCircle } from 'lucide-react'
import type { AvisoPausa as Aviso } from '@/features/rastreamento-ocular/pausa'

/** O aviso de pausa no centro da tela (jogo e calibração): título, o que fazer e quando continua. */
export default function AvisoPausa({ aviso }: { aviso: Aviso }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-navy/40 px-4" role="alertdialog" aria-live="assertive">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 text-center shadow-sm">
        {aviso.titulo === 'Cuidado' ? (
          <AlertTriangle size={36} className="mx-auto text-[var(--color-warn)]" />
        ) : (
          <PauseCircle size={36} className="mx-auto text-[var(--color-warn)]" />
        )}
        <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--color-navy)]">{aviso.titulo}</h2>
        <p className="mt-2 text-base text-[var(--color-ink)]">{aviso.texto}</p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{aviso.rodape}</p>
      </div>
    </div>
  )
}
