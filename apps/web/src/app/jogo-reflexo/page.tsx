'use client'

import { useState } from 'react'
import ApresentacaoReflexo from '@/features/jogo-reflexo/components/jogo-reflexo-apresentacao'
import TelaReflexo from '@/features/jogo-reflexo/components/TelaReflexo'
import ComJogador from '@/features/jogadores/components/ComJogador'

// A partida é de um jogador escolhido (?jogador=); na 1ª vez dele, a introdução vem antes.
export default function PaginaJogoReflexo() {
  return (
    <ComJogador exigirHistoria>
      <JogoReflexo />
    </ComJogador>
  )
}

function JogoReflexo() {
  const [etapa, setEtapa] = useState<'apresentacao' | 'jogo'>('apresentacao')

  if (etapa === 'apresentacao') {
    return (
      <ApresentacaoReflexo
        onComecar={() => setEtapa('jogo')}
        onVoltar={() => window.history.back()}
      />
    )
  }

  return <TelaReflexo onVoltar={() => setEtapa('apresentacao')} />
}