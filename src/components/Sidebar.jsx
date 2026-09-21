import { NavLink } from 'react-router-dom'
import { X, Home } from 'lucide-react'
import { SOFTWARES } from '../data/softwares'

const ITENS = [
  { rota: '/', label: 'Início', Icone: Home, fim: true },
  ...SOFTWARES.map(({ rota, nome, Icone }) => ({ rota, label: nome, Icone })),
]

export default function Sidebar({ aberta, aoFechar }) {
  return (
    <>
      {/* Overlay: só existe no drawer mobile; em telas largas (lg+) a barra é permanente. */}
      <div
        onClick={aoFechar}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-navy/40 transition-opacity lg:hidden ${
          aberta ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80%] bg-[var(--color-surface)] shadow-sm transition-transform duration-300 lg:translate-x-0 lg:border-r lg:border-navy/10 lg:shadow-none ${
          aberta ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu de navegação"
      >
        <div className="flex items-center justify-between px-5 pt-6">
          <span className="font-display text-xl font-semibold text-[var(--color-navy)]">iris hub</span>
          <button
            onClick={aoFechar}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg)] lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-[var(--color-navy)]" />
          </button>
        </div>

        <nav className="mt-6 space-y-1 px-3">
          {ITENS.map(({ rota, label, Icone, fim }) => (
            <NavLink
              key={rota}
              to={rota}
              end={fim}
              onClick={aoFechar}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-bg)] text-[var(--color-navy)]'
                    : 'text-[var(--color-ink)] active:bg-[var(--color-bg)]'
                }`
              }
            >
              <Icone size={20} className="text-[var(--color-navy)]" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
