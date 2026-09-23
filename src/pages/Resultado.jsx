import { useState } from 'react'
import LaudoDocumento from '../components/LaudoDocumento'
import { decodificarResumo } from '../services/laudo'

function lerDoLink() {
  const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return decodificarResumo(parametros.get('d') ?? '')
}

// Página aberta pelo QR code: mostra o laudo a partir dos dados contidos no link,
// sem depender das sessões guardadas no computador da apresentação.
export default function Resultado() {
  const [dados] = useState(lerDoLink)

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 py-6">
      <p className="mb-4 font-display text-lg font-semibold text-[var(--color-navy)]">iris hub</p>
      {dados ? (
        <LaudoDocumento grupos={dados.grupos} dataIso={dados.dataIso} />
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
