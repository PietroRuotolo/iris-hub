import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
      <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">Página não encontrada</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">O endereço acessado não existe no iris hub.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-[var(--color-navy)]">
        Voltar ao menu
      </Link>
    </div>
  )
}
