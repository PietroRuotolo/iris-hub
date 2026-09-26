import Link from 'next/link'

export default function NaoEncontrada() {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
      <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">Página não encontrada</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">O endereço acessado não existe no iris hub.</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium text-[var(--color-navy)]">
        Voltar ao menu
      </Link>
    </div>
  )
}
