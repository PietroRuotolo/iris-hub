'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Jogador } from '@/lib/api/usuarios'
import SeletorJogador from './SeletorJogador'

// A escolha "Quem vai jogar?" em cima da página (ao clicar no card de um jogo).
export default function ModalJogador({
  titulo,
  voltarPara,
  aoEscolher,
  aoFechar,
}: {
  titulo?: string
  voltarPara: string
  aoEscolher: (jogador: Jogador) => void
  aoFechar: () => void
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 px-4 py-[10vh]" onClick={aoFechar}>
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
        >
          <X size={18} />
        </button>
        <SeletorJogador titulo={titulo} voltarPara={voltarPara} aoEscolher={aoEscolher} />
      </div>
    </div>
  )
}
