import { SOFTWARES } from '../data/softwares'
import SoftwareCard from '../components/SoftwareCard'

export default function Home() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">iris hub</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Ponto de entrada do ecossistema iris: escolha um software para conhecer.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {SOFTWARES.map((software) => (
          <SoftwareCard key={software.id} software={software} />
        ))}
      </div>
    </>
  )
}
