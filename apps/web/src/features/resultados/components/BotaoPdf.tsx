'use client'

import { FileDown } from 'lucide-react'

/**
 * Abre a impressão do navegador, onde a pessoa escolhe "Salvar como PDF" (funciona no celular:
 * Chrome → Compartilhar/Imprimir → Salvar como PDF; Safari → Compartilhar → Imprimir). O layout de
 * impressão esconde os botões (classe print:hidden).
 */
export default function BotaoPdf() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 active:scale-[0.99] print:hidden"
    >
      <FileDown size={20} /> Baixar PDF do resumo
    </button>
  )
}
