'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Play } from 'lucide-react'
import ModalJogador from '@/features/jogadores/components/ModalJogador'
import { urlComJogador } from '@/features/jogadores/url'
import { jogoPorChave, type ChaveJogo } from '@/lib/jogos'
import SeloStatus from './SeloStatus'

// Card do jogo na página inicial: clicar abre "Quem vai jogar?" e, escolhida a pessoa, começa o jogo
// como ela. "Ver detalhes" leva à apresentação. Recebe só a chave (a página que o usa é do servidor, e
// o ícone do jogo, uma função, não pode atravessar para o navegador).
export default function CartaoJogo({ chave, atraso = 0 }: { chave: ChaveJogo; atraso?: number }) {
  const { rota, rotaJogar, nome, tipo, descricao, status, Icone } = jogoPorChave(chave)
  const router = useRouter()
  const [escolhendo, setEscolhendo] = useState(false)

  return (
    <>
      <div
        style={{ animationDelay: `${atraso}ms` }}
        className="group flex h-full flex-col rounded-2xl bg-[var(--color-surface)] shadow-sm transition duration-200 motion-safe:animate-fade-up lg:hover:-translate-y-1 lg:hover:shadow-md"
      >
        <button
          type="button"
          onClick={() => setEscolhendo(true)}
          className="flex flex-1 cursor-pointer flex-col gap-3 rounded-2xl p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] active:scale-[0.99]"
        >
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg)] transition-colors duration-200 lg:group-hover:bg-[var(--color-navy)]">
              <Icone size={24} className="text-[var(--color-navy)] transition-colors duration-200 lg:group-hover:text-[var(--color-surface)]" />
            </div>
            <SeloStatus status={status} />
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">{nome}</h2>
            <p className="text-sm text-[var(--color-ink-soft)]">{tipo}</p>
          </div>

          <p className="flex-1 text-sm text-[var(--color-ink)]">{descricao}</p>

          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-navy)]">
            <Play size={16} /> Jogar
          </span>
        </button>

        <Link
          href={rota}
          className="mx-5 mb-4 flex items-center gap-1 self-start text-sm font-medium text-[var(--color-ink-soft)] outline-none hover:text-[var(--color-navy)] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
        >
          Ver detalhes <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      {escolhendo && (
        <ModalJogador
          titulo="Quem vai jogar?"
          voltarPara={rotaJogar}
          aoEscolher={(jogador) => router.push(urlComJogador(rotaJogar, jogador.id))}
          aoFechar={() => setEscolhendo(false)}
        />
      )}
    </>
  )
}
