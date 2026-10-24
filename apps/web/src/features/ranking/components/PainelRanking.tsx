    'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Eye, LoaderCircle, Palette, RotateCcw, Trophy, Zap } from 'lucide-react'
import type { LinhaRankingGeral } from '@iris/contracts'
import { buscarRanking } from '@/lib/api/ranking'
import TabelaRanking from './TabelaRanking'

type Estado = { tipo: 'carregando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'pronto'; linhas: LinhaRankingGeral[] }

/** De quanto em quanto tempo o ranking se atualiza sozinho (ms). */
export const INTERVALO_ATUALIZACAO_MS = 5_000

/**
 * Busca o ranking no backend e mostra a tabela (ou o que estiver acontecendo: carregando, erro, vazio).
 * Atualiza sozinho a cada 5 s, sem tirar a tabela da tela; com a aba escondida, para, e ao voltar
 * atualiza na hora. Se uma atualização falhar, a última tabela continua.
 */
export default function PainelRanking() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [falhouAtualizar, setFalhouAtualizar] = useState(false)
  const temDados = useRef(false)

  const carregar = useCallback(() => {
    buscarRanking().then(
      (linhas) => {
        temDados.current = true
        setEstado({ tipo: 'pronto', linhas })
        setAtualizadoEm(new Date())
        setFalhouAtualizar(false)
        setBuscando(false)
      },
      (erro: unknown) => {
        setBuscando(false)
        // Já havia tabela: ela fica, só avisa. Sem tabela ainda: a tela de erro.
        if (temDados.current) setFalhouAtualizar(true)
        else setEstado({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : 'Erro ao buscar o ranking' })
      },
    )
  }, [])

  useEffect(() => {
    carregar()
    // As atualizações automáticas (só com a aba à vista) mostram o ícone girando enquanto buscam.
    const atualizar = () => {
      if (document.visibilityState !== 'visible') return
      setBuscando(true)
      carregar()
    }
    const id = setInterval(atualizar, INTERVALO_ATUALIZACAO_MS)
    // Voltou para a aba: atualiza na hora.
    document.addEventListener('visibilitychange', atualizar)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', atualizar)
    }
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
      <>
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
        <Atualizacao em={atualizadoEm} buscando={buscando} falhou={falhouAtualizar} />
      </>
    )
  }

  return (
    <>
      <TabelaRanking linhas={estado.linhas} />
      <Atualizacao em={atualizadoEm} buscando={buscando} falhou={falhouAtualizar} />
    </>
  )
}

/** Embaixo do ranking: quando foi a última atualização (e se a mais recente falhou). */
function Atualizacao({ em, buscando, falhou }: { em: Date | null; buscando: boolean; falhou: boolean }) {
  if (!em) return null
  return (
    <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-[var(--color-ink-soft)]" role="status" aria-live="polite">
      {buscando ? <LoaderCircle size={12} className="animate-spin" /> : <RotateCcw size={12} />}
      {falhou ? 'Não foi possível atualizar; tentando de novo. ' : ''}
      Atualizado às {em.toLocaleTimeString('pt-BR')} · atualiza sozinho a cada {INTERVALO_ATUALIZACAO_MS / 1000} s
    </p>
  )
}