'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import type { SessaoJogo } from '@iris/contracts'
import { obterSessao } from '@/lib/api/sessoes'
import { resumoDaSessao } from '../resumo'
import ResumoSessao from './ResumoSessao'

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; sessao: SessaoJogo }

/** Resumo de uma sessão salva no banco. O id vem da URL; o backend só entrega a sessão da pessoa. */
export default function ResumoSalvo({ id }: { id: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })

  useEffect(() => {
    let ativo = true
    obterSessao(id).then(
      (sessao) => ativo && setEstado({ tipo: 'pronto', sessao }),
      (erro: unknown) =>
        ativo && setEstado({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : String(erro) }),
    )
    return () => {
      ativo = false
    }
  }, [id])

  if (estado.tipo === 'carregando') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)] shadow-sm" role="status">
        <LoaderCircle size={16} className="animate-spin" /> Carregando o resumo…
      </div>
    )
  }

  if (estado.tipo === 'erro') {
    return (
      <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-start gap-3 rounded-xl bg-[var(--color-warn-bg)] p-4" role="alert">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
          <p className="text-sm text-[var(--color-ink)]">
            Não foi possível abrir esta sessão: {estado.mensagem}
          </p>
        </div>
        <Link href="/sessoes" className="mt-4 inline-block text-sm font-medium text-[var(--color-navy)]">
          Ver todas as sessões
        </Link>
      </div>
    )
  }

  return <ResumoSessao resumo={resumoDaSessao(estado.sessao)} />
}
