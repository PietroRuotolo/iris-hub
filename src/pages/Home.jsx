import { Link } from 'react-router-dom'
import { ArrowRight, QrCode } from 'lucide-react'
import useSessoes from '../hooks/useSessoes'
import { SOFTWARES } from '../data/softwares'
import SoftwareCard from '../components/SoftwareCard'

function BannerExperiencia() {
  const total = useSessoes().length

  return (
    <Link
      to="/sessoes"
      className="group flex items-center gap-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] motion-safe:animate-fade-up"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-good-bg)]">
        <QrCode size={24} className="text-[var(--color-good)]" />
      </div>
      <div className="flex-1">
        <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">Experiência de demonstração</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {total === 0 ? 'Nenhuma sessão carregada' : `${total} ${total === 1 ? 'sessão carregada' : 'sessões carregadas'}`}
          {' · '}gere o laudo com QR code
        </p>
      </div>
      <ArrowRight size={18} className="text-[var(--color-navy)] transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

export default function Home() {
  return (
    <>
      <BannerExperiencia />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {SOFTWARES.map((software, i) => (
          <SoftwareCard key={software.id} software={software} atraso={i * 80} />
        ))}
      </div>
    </>
  )
}
