'use client'

import { useState } from 'react'
import ApresentacaoReflexo from '@/features/jogo-reflexo/components/jogo-reflexo-apresentacao'
import TelaReflexo from '@/features/jogo-reflexo/components/TelaReflexo'

export default function PaginaJogoReflexo() {
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