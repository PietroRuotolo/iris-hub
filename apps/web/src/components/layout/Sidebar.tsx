'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogOut, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthGate'
import { GRUPOS_MENU, ITEM_CONFIGURACOES, itemAtivo, type ItemMenu } from '@/lib/navegacao'

type Props = { aberta: boolean; aoFechar: () => void }

export default function Sidebar({ aberta, aoFechar }: Props) {
  const caminho = usePathname()
  const { usuario, sair } = useAuth()

  return (
    <>
      {/* Overlay: só existe na gaveta mobile; em telas largas (lg+) a barra é permanente. */}
      <div
        onClick={aoFechar}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-navy/40 transition-opacity lg:hidden ${
          aberta ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-[var(--color-surface)] shadow-sm transition-transform duration-300 lg:translate-x-0 lg:border-r lg:border-navy/10 lg:shadow-none ${
          aberta ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu de navegação"
      >
        <div className="flex items-center justify-between px-5 pt-6">
          <Image src="/logo/iris-hubs-logo-azul-sem-fundo.svg" alt="Iris Hubs" width={120} height={35} />
          <button
            onClick={aoFechar}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg)] lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} className="text-[var(--color-navy)]" />
          </button>
        </div>

        <nav className="mt-6 space-y-6 px-3">
          {GRUPOS_MENU.map(({ titulo, itens }) => (
            <div key={titulo ?? 'principal'} className="space-y-1">
              {titulo && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
                  {titulo}
                </p>
              )}
              {itens.map((item) => (
                <LinkMenu key={item.rota} item={item} caminho={caminho} aoClicar={aoFechar} />
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto px-3 pb-2">
          <LinkMenu item={ITEM_CONFIGURACOES} caminho={caminho} aoClicar={aoFechar} />
        </div>

        <div className="border-t border-navy/10 p-4">
          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{usuario.nome}</p>
          <button type="button" onClick={() => void sair()} className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-navy)]">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
    </>
  )
}

function LinkMenu({ item: { rota, label, Icone }, caminho, aoClicar }: { item: ItemMenu; caminho: string; aoClicar: () => void }) {
  const ativo = itemAtivo(rota, caminho)
  return (
    <Link
      href={rota}
      onClick={aoClicar}
      aria-current={ativo ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition ${
        ativo
          ? 'bg-[var(--color-bg)] text-[var(--color-navy)]'
          : 'text-[var(--color-ink)] active:bg-[var(--color-bg)]'
      }`}
    >
      <Icone size={20} className="text-[var(--color-navy)]" />
      {label}
    </Link>
  )
}
