import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, QrCode } from 'lucide-react'
import useSessoes from '../hooks/useSessoes'
import { SOFTWARES, FILTROS } from '../data/softwares'
import SoftwareCard from '../components/SoftwareCard'

function Resumo() {
  const disponiveis = SOFTWARES.filter((s) => s.status === 'disponivel').length
  const emDesenvolvimento = SOFTWARES.length - disponiveis

  return (
    <section className="rounded-2xl bg-[var(--color-navy)] p-6 shadow-sm motion-safe:animate-fade-up">
      <h1 className="font-display text-2xl font-semibold text-[var(--color-surface)]">iris hub</h1>
      <p className="mt-1 text-sm text-[var(--color-bg)]/80">
        Ponto de entrada do ecossistema iris. Escolha um software para conhecer.
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-3">
        {[
          ['Softwares', SOFTWARES.length],
          ['Disponíveis', disponiveis],
          ['Em desenvolvimento', emDesenvolvimento],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl bg-[var(--color-surface)]/10 px-3 py-3">
            <dd className="font-display text-2xl font-semibold text-[var(--color-surface)]">{valor}</dd>
            <dt className="text-xs text-[var(--color-bg)]/80">{rotulo}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

function BannerExperiencia() {
  const total = useSessoes().length

  return (
    <Link
      to="/sessoes"
      className="group mt-4 flex items-center gap-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] motion-safe:animate-fade-up"
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
  const [filtro, setFiltro] = useState('todos')
  const visiveis = SOFTWARES.filter((s) => filtro === 'todos' || s.categoria === filtro)

  return (
    <>
      <Resumo />
      <BannerExperiencia />

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrar softwares">
        {FILTROS.map(({ id, label }) => {
          const ativo = filtro === id
          return (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              aria-pressed={ativo}
              className={`rounded-full px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] ${
                ativo
                  ? 'bg-[var(--color-navy)] text-[var(--color-surface)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm lg:hover:bg-[var(--color-good-bg)]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {visiveis.map((software, i) => (
          // A chave inclui o filtro para a animação de entrada rodar de novo ao filtrar.
          <SoftwareCard key={`${filtro}-${software.id}`} software={software} atraso={i * 80} />
        ))}
      </div>
    </>
  )
}
