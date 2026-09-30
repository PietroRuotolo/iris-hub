import Link from 'next/link'
import { ArrowRight, QrCode } from 'lucide-react'
import CartaoJogo from '@/features/jogo-ritmo/components/CartaoJogo'
import { JOGOS } from '@/lib/jogos'

function BannerExperiencia() {
  return (
    <Link
      href="/sessoes"
      className="group flex items-center gap-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] motion-safe:animate-fade-up"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-good-bg)]">
        <QrCode size={24} className="text-[var(--color-good)]" />
      </div>
      <div className="flex-1">
        <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">Experiência de demonstração</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">Suas partidas dos 3 jogos · gere o resumo com QR code</p>
      </div>
      <ArrowRight size={18} className="text-[var(--color-navy)] transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

export default function Inicio() {
  return (
    <>
      <BannerExperiencia />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {JOGOS.map((jogo, i) => (
          <CartaoJogo key={jogo.id} jogo={jogo} atraso={i * 80} />
        ))}
      </div>
    </>
  )
}
