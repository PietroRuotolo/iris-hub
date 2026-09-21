import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function SoftwareCard({ software }) {
  const { rota, nome, tipo, descricao, status, Icone } = software

  return (
    <Link
      to={rota}
      className="flex h-full flex-col gap-3 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm transition active:scale-[0.99] lg:hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg)]">
          <Icone size={24} className="text-[var(--color-navy)]" />
        </div>
        <StatusBadge status={status} />
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">{nome}</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">{tipo}</p>
      </div>

      <p className="flex-1 text-sm text-[var(--color-ink)]">{descricao}</p>

      <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        Ver detalhes <ChevronRight size={16} />
      </span>
    </Link>
  )
}
