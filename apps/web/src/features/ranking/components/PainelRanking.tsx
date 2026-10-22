    'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Eye, LoaderCircle, Palette, RotateCcw, Trophy, Zap } from 'lucide-react'
import type { LinhaRankingGeral } from '@iris/contracts'
import { buscarRanking } from '@/lib/api/ranking'
import TabelaRanking from './TabelaRanking'

type Estado = { tipo: 'carregando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'pronto'; linhas: LinhaRankingGeral[] }

/** Busca o ranking no backend e mostra a tabela (ou o que estiver acontecendo: carregando, erro, vazio). */
export default function PainelRanking() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })

  const carregar = useCallback(() => {
    buscarRanking().then(
      (linhas) => setEstado({ tipo: 'pronto', linhas }),
      (erro: unknown) => setEstado({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : 'Erro ao buscar o ranking' }),
    )
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (estado.tipo === 'carregando') {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] p-6 text-sm text-[var(--color-ink-soft)] shadow-sm" role="status">
        <LoaderCircle size={18} className="animate-spin" /> Carregando o ranking…
      </p>
    )
  }

  if (estado.tipo === 'erro') {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--color-warn-bg)] p-4 text-sm text-[var(--color-warn)]" role="alert">
        <AlertTriangle size={18} /> Não foi possível carregar o ranking ({estado.mensagem}).
        <button
          type="button"
          onClick={() => {
            setEstado({ tipo: 'carregando' })
            carregar()
          }}
          className="inline-flex cursor-pointer items-center gap-1 font-semibold underline underline-offset-2"
        >
          <RotateCcw size={14} /> Tentar de novo
        </button>
      </div>
    )
  }

  if (estado.linhas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-6 py-10 text-center shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
          <Trophy size={24} />
        </span>
        <p className="font-display text-lg font-semibold text-[var(--color-navy)]">Ninguém completou os 3 jogos ainda</p>
        <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">Para entrar no ranking, termine uma partida de cada jogo:</p>
        <ul className="flex flex-wrap justify-center gap-2 text-sm font-medium text-[var(--color-ink)]">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg)] px-3 py-1.5">
            <Eye size={15} className="text-[var(--color-ink-soft)]" /> Ritmo
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg)] px-3 py-1.5">
            <Zap size={15} className="text-[var(--color-ink-soft)]" /> Reflexo
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg)] px-3 py-1.5">
            <Palette size={15} className="text-[var(--color-ink-soft)]" /> Cores
          </li>
        </ul>
      </div>
    )
  }

  return <TabelaRanking linhas={estado.linhas} />
}