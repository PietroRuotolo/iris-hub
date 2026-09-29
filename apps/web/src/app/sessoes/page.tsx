'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Eye, LoaderCircle } from 'lucide-react'
import type { SessaoJogo, StatusSessao } from '@iris/contracts'
import { formatarData, NOME_JOGO_RITMO } from '@/features/resultados/resumo'
import { listarSessoes } from '@/lib/api/sessoes'

const STATUS: Record<StatusSessao, { label: string; classes: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', classes: 'bg-[var(--color-bg)] text-[var(--color-ink-soft)]' },
  CONCLUIDA: { label: 'Concluída', classes: 'bg-[var(--color-good-bg)] text-[var(--color-good)]' },
  CANCELADA: { label: 'Interrompida', classes: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]' },
}

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; sessoes: SessaoJogo[] }

function ItemSessao({ sessao }: { sessao: SessaoJogo }) {
  const status = STATUS[sessao.status]
  return (
    <li>
      <Link
        href={`/sessao/${encodeURIComponent(sessao.id)}/resumo`}
        className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4 shadow-sm outline-none transition hover:brightness-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)]">
          <Eye size={18} className="text-[var(--color-navy)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-[var(--color-navy)]">
            {formatarData(sessao.concluidaEm ?? sessao.iniciadaEm)}
          </p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {sessao.pontuacaoTotal === null ? 'Sem pontuação' : `${Math.round(sessao.pontuacaoTotal)} / 100`}
            {' · '}
            {sessao.fases.length} de 5 fases
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span>
        <ChevronRight size={18} className="shrink-0 text-[var(--color-ink-soft)]" />
      </Link>
    </li>
  )
}

// Histórico de partidas da pessoa logada, lido do banco (as sessões são salvas durante a partida).
export default function Sessoes() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })

  useEffect(() => {
    let ativo = true
    listarSessoes().then(
      (sessoes) => ativo && setEstado({ tipo: 'pronto', sessoes }),
      (erro: unknown) =>
        ativo && setEstado({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : String(erro) }),
    )
    return () => {
      ativo = false
    }
  }, [])

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Sessões</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Cada partida do {NOME_JOGO_RITMO.toLowerCase()} é salva na sua conta ao ser jogada. Abra uma sessão para ver o
        resumo dela.
      </p>

      {estado.tipo === 'carregando' && (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)] shadow-sm" role="status">
          <LoaderCircle size={16} className="animate-spin" /> Carregando suas sessões…
        </p>
      )}

      {estado.tipo === 'erro' && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-5 shadow-sm" role="alert">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
          <div>
            <p className="text-sm text-[var(--color-ink)]">Não foi possível carregar suas sessões: {estado.mensagem}</p>
            <button
              type="button"
              onClick={() => {
                setEstado({ tipo: 'carregando' })
                listarSessoes().then(
                  (sessoes) => setEstado({ tipo: 'pronto', sessoes }),
                  (erro: unknown) =>
                    setEstado({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : String(erro) }),
                )
              }}
              className="mt-2 cursor-pointer text-sm font-medium text-[var(--color-navy)] underline"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      )}

      {estado.tipo === 'pronto' && (
        <>
          <h2 className="mt-6 font-display text-lg font-semibold text-[var(--color-navy)]">
            Partidas salvas ({estado.sessoes.length})
          </h2>
          {estado.sessoes.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
              <p className="text-sm text-[var(--color-ink-soft)]">
                Nenhuma partida ainda. Os resultados aparecem aqui assim que você jogar.
              </p>
              <Link
                href="/jogo"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2"
              >
                <Eye size={18} /> Ir para o jogo de ritmo
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {estado.sessoes.map((sessao) => (
                <ItemSessao key={sessao.id} sessao={sessao} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
