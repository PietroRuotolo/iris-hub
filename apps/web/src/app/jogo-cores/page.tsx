'use client'

import { useState } from 'react'
import JogoCoresApresentacao from '@/features/jogo-cores/components/jogo-cores-apresentacao'
import TelaJogoCores from '@/features/jogo-cores/components/TelaJogoCores'
import ComJogador from '@/features/jogadores/components/ComJogador'

// A partida é de um jogador escolhido (?jogador=); na 1ª vez dele, a introdução vem antes.
export default function JogoCoresPage() {
  return (
    <ComJogador exigirHistoria>
      <JogoCores />
    </ComJogador>
  )
}

function JogoCores() {
  const [jogando, setJogando] = useState(false)

  if (jogando) {
    return <TelaJogoCores onVoltar={() => setJogando(false)} />
  }

  return <JogoCoresApresentacao onIniciar={() => setJogando(true)} />
}