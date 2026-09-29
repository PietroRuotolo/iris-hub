'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Eye, LoaderCircle } from 'lucide-react'
import type { StatusSessao } from '@iris/contracts'
import {
  NOME_DO_JOGO,
  caminhoDoResumo,
  itemDoCores,
  itemDoReflexo,
  itemDoRitmo,
  ordenarHistorico,
  type ItemHistorico,
  type JogoHistorico,
} from '@/features/resultados/historico'
import { formatarData } from '@/features/resultados/resumo'
import { listarSessoesCores } from '@/lib/api/cores'
import { listarSessoesReflexo } from '@/lib/api/reflexo'
import { listarSessoes } from '@/lib/api/sessoes'

const STATUS: Record<StatusSessao, { label: string; classes: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', classes: 'bg-[var(--color-bg)] text-[var(--color-ink-soft)]' },
  CONCLUIDA: { label: 'Concluída', classes: 'bg-[var(--color-good-bg)] text-[var(--color-good)]' },
  CANCELADA: { label: 'Interrompida', classes: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]' },
}

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  // `falhas`: jogos cuja lista não carregou (os outros aparecem normalmente).
  | { tipo: 'pronto'; itens: ItemHistorico[]; falhas: JogoHistorico[] }

/** Busca os três jogos ao mesmo tempo. Um que falhe não esconde os demais. */
async function carregarHistorico(): Promise<Estado> {
  const jogos: JogoHistorico[] = ['ritmo', 'reflexo', 'cores']
  const resultados = await Promise.allSettled([
    listarSessoes().then((l) => l.map(itemDoRitmo)),
    listarSessoesReflexo().then((l) => l.map(itemDoReflexo)),
    listarSessoesCores().then((l) => l.map(itemDoCores)),
  ])

  if (resultados.every((r) => r.status === 'rejected')) {
    const motivo = resultados[0].status === 'rejected' ? resultados[0].reason : null
    return { tipo: 'erro', mensagem: motivo instanceof Error ? motivo.message : 'erro desconhecido' }
  }
  const itens = resultados.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  const falhas = jogos.filter((_, i) => resultados[i].status === 'rejected')
  return { tipo: 'pronto', itens: ordenarHistorico(itens), falhas }
}

function ItemSessao({ item }: { item: ItemHistorico }) {
  const status = STATUS[item.status]
  return (
    <li>
      <Link
        href={caminhoDoResumo(item)}
        className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4 shadow-sm outline-none transition hover:brightness-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)]">
          <Eye size={18} className="text-[var(--color-navy)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-[var(--color-navy)]">
            {NOME_DO_JOGO[item.jogo]}
            <span className="font-normal text-[var(--color-ink-soft)]"> · {formatarData(item.data)}</span>
          </p>
          <p className="text-sm text-[var(--color-ink-soft)]">{item.resumo}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span>
        <ChevronRight size={18} className="shrink-0 text-[var(--color-ink-soft)]" />
      </Link>
    </li>
  )
}

// Histórico de partidas da pessoa logada, dos três jogos, lido do banco (cada partida é salva ao ser jogada).
export default function Sessoes() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })

  const carregar = useCallback(() => {
    carregarHistorico().then(setEstado)
  }, [])

  useEffect(() => {
    let ativo = true
    carregarHistorico().then((novo) => ativo && setEstado(novo))
    return () => {
      ativo = false
    }
  }, [])

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Sessões</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Cada partida dos jogos é salva na sua conta ao ser jogada. Abra uma sessão para ver o resumo dela.
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
                carregar()
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
          {estado.falhas.length > 0 && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-4" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
              <p className="text-sm text-[var(--color-ink)]">
                Não foi possível carregar as sessões de: {estado.falhas.map((j) => NOME_DO_JOGO[j]).join(', ')}. As demais
                aparecem abaixo.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setEstado({ tipo: 'carregando' })
                    carregar()
                  }}
                  className="cursor-pointer font-medium text-[var(--color-navy)] underline"
                >
                  Tentar de novo
                </button>
              </p>
            </div>
          )}

          <h2 className="mt-6 font-display text-lg font-semibold text-[var(--color-navy)]">
            Partidas salvas ({estado.itens.length})
          </h2>
          {estado.itens.length === 0 ? (
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
              {estado.itens.map((item) => (
                <ItemSessao key={`${item.jogo}-${item.id}`} item={item} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
