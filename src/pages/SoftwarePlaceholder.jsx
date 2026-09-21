import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'

// Contrato de cada rota de software; as próximas fases substituem o miolo por conteúdo real.
export default function SoftwarePlaceholder({ software }) {
  const { nome, tipo, descricao, status, Icone } = software

  return (
    <>
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar ao menu
      </Link>

      <div className="mt-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-bg)]">
            <Icone size={28} className="text-[var(--color-navy)]" />
          </div>
          <StatusBadge status={status} />
        </div>

        <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-navy)]">{nome}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{tipo}</p>
        <p className="mt-3 text-base text-[var(--color-ink)]">{descricao}</p>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-5">
        <Construction size={20} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
        <p className="text-sm text-[var(--color-ink)]">
          Conteúdo em construção. Esta página será preenchida nas próximas fases do projeto.
        </p>
      </div>
    </>
  )
}
