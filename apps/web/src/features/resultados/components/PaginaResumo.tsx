'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { JogoHistorico } from '../historico'
import ComJogador from '@/features/jogadores/components/ComJogador'
import { urlComJogador } from '@/features/jogadores/url'
import CompartilharResumo from './CompartilharResumo'
import ResumoSalvo from './ResumoSalvo'

// Resumo de uma sessão salva de um jogador (?jogador=): o backend só devolve a sessão se for dele.
export default function PaginaResumo({ id, jogo }: { id: string; jogo: JogoHistorico }) {
  return (
    <ComJogador titulo="De quem é esta partida?">
      {(jogador) => (
        <>
          <Link href={urlComJogador('/sessoes', jogador.id)} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
            <ArrowLeft size={16} /> Voltar às sessões
          </Link>

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <ResumoSalvo id={id} jogo={jogo} />
            <CompartilharResumo />
          </div>
        </>
      )}
    </ComJogador>
  )
}
