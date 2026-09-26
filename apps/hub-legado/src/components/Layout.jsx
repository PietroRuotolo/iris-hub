import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar aberta={menuAberto} aoFechar={() => setMenuAberto(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-[var(--color-bg)] px-4 py-4 lg:hidden">
          <button
            onClick={() => setMenuAberto(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] shadow-sm"
            aria-label="Abrir menu"
          >
            <Menu size={20} className="text-[var(--color-navy)]" />
          </button>
          <span className="font-display text-lg font-semibold text-[var(--color-navy)]">iris hub</span>
        </header>

        <main className="mx-auto w-full max-w-md px-4 pb-10 pt-2 lg:max-w-4xl lg:px-8 lg:pt-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
