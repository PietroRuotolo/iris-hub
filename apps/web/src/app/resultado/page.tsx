import { FileDown } from 'lucide-react'
import ResumoSessao from '@/features/resultados/components/ResumoSessao'
import { RESUMO_EXEMPLO } from '@/features/resultados/resumo-exemplo'

// Página aberta pelo QR code no celular (tela cheia, sem menu). Só o layout: resumo de exemplo,
// e o botão ainda não gera o PDF.
export default function Resultado() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 py-6">
      <p className="mb-4 font-display text-lg font-semibold text-[var(--color-navy)]">iris hub</p>

      <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">Seu resumo está pronto</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Baixe o PDF para guardar ou compartilhar. A prévia abaixo mostra o mesmo conteúdo na tela.
        </p>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-70"
        >
          <FileDown size={20} /> Baixar PDF do resumo
        </button>
      </div>

      <div className="mt-4">
        <ResumoSessao resumo={RESUMO_EXEMPLO} />
      </div>
    </div>
  )
}
