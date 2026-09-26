'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import AuthGate from '@/components/auth/AuthGate'
import Sidebar from './Sidebar'
import { ehTelaCheia } from '@/lib/navegacao'

// Casca das páginas: menu lateral e área de conteúdo; calibração e resultado usam tela cheia.
export default function Shell({ children }: { children: React.ReactNode }) {
  const caminho = usePathname()
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <AuthGate>
      {ehTelaCheia(caminho) ? children : (
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
              <Image src="/logo/iris-hubs-logo-azul-sem-fundo.svg" alt="Iris Hubs" width={100} height={29} />
            </header>
            <main className="mx-auto w-full max-w-md px-4 pb-10 pt-2 lg:max-w-4xl lg:px-8 lg:pt-10">{children}</main>
          </div>
        </div>
      )}
    </AuthGate>
  )
}
