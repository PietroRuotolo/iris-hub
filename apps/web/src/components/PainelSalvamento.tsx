'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, LoaderCircle, Save } from 'lucide-react'

export type EstadoGravacao =
  | { tipo: 'ocioso' }
  | { tipo: 'salvando' }
  | { tipo: 'salvo'; id: string }
  | { tipo: 'erro'; mensagem: string }

interface Props {
  estado: EstadoGravacao
  /** Qual jogo, para o link do resumo salvo (a página do resumo usa `?jogo=`). */
  jogo: 'reflexo' | 'cores'
  /** Rótulo do botão de salvar. Sem ele, o painel só mostra o andamento e o erro (jogos que salvam sozinhos). */
  rotuloSalvar?: string
  /** Se há o que salvar agora. */
  podeSalvar?: boolean
  aoSalvar: () => void
}

/** Estado do salvamento de uma partida: salvando, salvo (com link para o resumo) ou erro (com nova tentativa). */
export default function PainelSalvamento({ estado, jogo, rotuloSalvar, podeSalvar = true, aoSalvar }: Props) {
  if (estado.tipo === 'salvando') {
    return (
      <p className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]" role="status">
        <LoaderCircle size={16} className="animate-spin" /> Salvando resultados…
      </p>
    )
  }

  if (estado.tipo === 'salvo') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-sm text-[var(--color-good)]">
          <CheckCircle2 size={16} /> Resultados salvos na sua conta.
        </p>
        <Link
          href={`/sessao/${encodeURIComponent(estado.id)}/resumo?jogo=${jogo}`}
          className="text-sm font-medium text-[var(--color-navy)] underline"
        >
          Ver o resumo salvo
        </Link>
      </div>
    )
  }

  if (estado.tipo === 'erro') {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-[var(--color-warn-bg)] p-4" role="alert">
        <p className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
          Não foi possível salvar: {estado.mensagem}
        </p>
        <button
          type="button"
          onClick={aoSalvar}
          className="w-fit cursor-pointer text-sm font-semibold text-[var(--color-navy)] underline"
        >
          Tentar salvar de novo
        </button>
      </div>
    )
  }

  if (!rotuloSalvar) return null
  return (
    <button
      type="button"
      onClick={aoSalvar}
      disabled={!podeSalvar}
      className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Save size={18} /> {rotuloSalvar}
    </button>
  )
}
