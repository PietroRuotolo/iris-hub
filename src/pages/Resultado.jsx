import { useState } from 'react'
import { AlertTriangle, FileDown, Loader2 } from 'lucide-react'
import LaudoDocumento from '../components/LaudoDocumento'
import { decodificarResumo } from '../services/laudo'
// Import dinâmico: @react-pdf/renderer é pesado e só é preciso nesta página
// (aberta pelo celular que escaneia o QR code) — não deve entrar no bundle
// principal, que o computador da apresentação carrega o tempo todo.

function lerDoLink() {
  const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return decodificarResumo(parametros.get('d') ?? '')
}

// Página aberta pelo QR code: baixa o PDF do laudo a partir dos dados contidos
// no próprio link (sem depender do computador da apresentação continuar no ar)
// e mostra uma prévia em tela para conferência.
export default function Resultado() {
  const [dados] = useState(lerDoLink)
  const [estado, setEstado] = useState('parado') // parado | gerando | erro

  async function baixar() {
    setEstado('gerando')
    try {
      const { baixarPdf } = await import('../services/pdf')
      await baixarPdf(dados.grupos, dados.dataIso)
      setEstado('parado')
    } catch (erro) {
      console.error('Falha ao gerar o PDF do laudo:', erro)
      setEstado('erro')
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 py-6">
      <p className="mb-4 font-display text-lg font-semibold text-[var(--color-navy)]">iris hub</p>
      {dados ? (
        <>
          <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
            <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">Seu laudo está pronto</h1>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Baixe o PDF para guardar ou compartilhar. A prévia abaixo mostra o mesmo conteúdo na tela.
            </p>

            <button
              onClick={baixar}
              disabled={estado === 'gerando'}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-70"
            >
              {estado === 'gerando' ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Gerando PDF…
                </>
              ) : (
                <>
                  <FileDown size={20} /> Baixar PDF do laudo
                </>
              )}
            </button>

            {estado === 'erro' && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--color-warn-bg)] p-3" role="alert">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
                <p className="text-sm text-[var(--color-ink)]">
                  Não foi possível gerar o PDF neste aparelho. Tente novamente ou use a prévia abaixo.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <LaudoDocumento grupos={dados.grupos} dataIso={dados.dataIso} />
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
          <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">Link inválido</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Não foi possível ler os dados do laudo. Escaneie o QR code novamente.
          </p>
        </div>
      )}
    </div>
  )
}
