'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import ComJogador from '@/features/jogadores/components/ComJogador'
import { urlComJogador } from '@/features/jogadores/url'
import { jogoPorChave } from '@/lib/jogos'

// Jogo de ritmo, pelo menu: como nos outros jogos, primeiro a escolha de quem vai jogar; escolhida a
// pessoa, a partida (/partida, tela cheia) abre direto com ela.
export default function Jogo() {
  return <ComJogador titulo="Quem vai jogar?">{(jogador) => <AbrirPartida jogadorId={jogador.id} />}</ComJogador>
}

function AbrirPartida({ jogadorId }: { jogadorId: string }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(urlComJogador(jogoPorChave('ritmo').rotaJogar, jogadorId))
  }, [router, jogadorId])

  return (
    <p className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--color-ink-soft)]" role="status">
      <LoaderCircle size={16} className="animate-spin" /> Abrindo a partida…
    </p>
  )
}
