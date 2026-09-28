'use client'

import { useState } from 'react'
import JogoCoresApresentacao from '@/features/jogo-cores/components/jogo-cores-apresentacao'
import TelaJogoCores from '@/features/jogo-cores/components/TelaJogoCores'

export default function JogoCoresPage() {
  const [jogando, setJogando] = useState(false)

  if (jogando) {
    return <TelaJogoCores onVoltar={() => setJogando(false)} />
  }

  return <JogoCoresApresentacao onIniciar={() => setJogando(true)} />
}