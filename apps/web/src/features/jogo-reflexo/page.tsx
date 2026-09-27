'use client'

import { useState } from 'react'
import ApresentacaoReflexo from '@/features/jogo-reflexo/components/jogo-reflexo-apresentacao'
import TelaReflexo from '@/features/jogo-reflexo/components/TelaReflexo'

export default function JogoReflexoPage() {
  const [etapa, setEtapa] = useState<'apresentacao' | 'jogo'>('apresentacao')

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      {etapa === 'apresentacao' ? (
        <ApresentacaoReflexo
          onComecar={() => setEtapa('jogo')}
          onVoltar={() => window.history.back()}
        />
      ) : (
        <TelaReflexo />
      )}
    </div>
  )
}