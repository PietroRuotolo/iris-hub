'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { GRUPOS_MENU, ITEM_CONFIGURACOES, itemAtivo, type ItemMenu } from '@/lib/navegacao'

type Props = {
  aberta: boolean
  aoFechar: () => void
  /** Telas largas: recolhida mostra só os ícones (no celular a gaveta é sempre inteira). */
  recolhida: boolean
  aoAlternar: () => void
}

export default function Sidebar({ aberta, aoFechar, recolhida, aoAlternar }: Props) {
  const caminho = usePathname()

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-[var(--color-surface)] shadow-sm transition-[transform,width] duration-300 lg:max-w-none lg:translate-x-0 lg:border-r lg:border-navy/10 lg:shadow-none ${
          aberta ? 'translate-x-0' : '-translate-x-full'
        } ${recolhida ? 'lg:w-20' : 'lg:w-72'}`}
        aria-label="Menu de navegação"
      >
        {/* Setinha para recolher (<) e abrir (>) o menu, na borda direita (só em telas largas). */}
        <button
          type="button"
          onClick={aoAlternar}
          aria-label={recolhida ? 'Abrir o menu' : 'Recolher o menu'}
          aria-expanded={!recolhida}
          className="absolute -right-3.5 top-8 z-10 hidden h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-navy)] shadow-sm ring-1 ring-navy/10 transition hover:bg-[var(--color-bg)] lg:flex"
        >
          {recolhida ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`flex items-center justify-between px-5 pt-6 ${recolhida ? 'lg:h-[41px] lg:px-0' : ''}`}>
          <Image
            src="/logo/iris-hubs-logo-azul-sem-fundo.svg"
            alt="Iris Hubs"
            width={120}
            height={35}
            className={recolhida ? 'lg:hidden' : ''}
          />
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
                <p className={`px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)] ${recolhida ? 'lg:hidden' : ''}`}>
                  {titulo}
                </p>
              )}
              {itens.map((item) => (
                <LinkMenu key={item.rota} item={item} caminho={caminho} aoClicar={aoFechar} recolhida={recolhida} />
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-navy/10 px-3 py-3">
          <LinkMenu item={ITEM_CONFIGURACOES} caminho={caminho} aoClicar={aoFechar} recolhida={recolhida} />
        </div>
      </aside>
    </>
  )
}

function LinkMenu({
  item: { rota, label, Icone },
  caminho,
  aoClicar,
  recolhida,
}: {
  item: ItemMenu
  caminho: string
  aoClicar: () => void
  recolhida: boolean
}) {
  const ativo = itemAtivo(rota, caminho)
  return (
    <Link
      href={rota}
      onClick={aoClicar}
      aria-current={ativo ? 'page' : undefined}
      // Recolhido, só o ícone aparece: o nome vai para a dica (title) e para o leitor de tela.
      title={recolhida ? label : undefined}
      aria-label={recolhida ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition ${recolhida ? 'lg:justify-center lg:px-0' : ''} ${
        ativo
          ? 'bg-[var(--color-bg)] text-[var(--color-navy)]'
          : 'text-[var(--color-ink)] active:bg-[var(--color-bg)]'
      }`}
    >
      <Icone size={20} className="shrink-0 text-[var(--color-navy)]" />
      <span className={`truncate ${recolhida ? 'lg:hidden' : ''}`}>{label}</span>
    </Link>
  )
}
