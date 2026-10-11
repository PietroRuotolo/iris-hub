'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, LoaderCircle, Search, UserPlus } from 'lucide-react'
import { buscarJogadores, type Jogador } from '@/lib/api/usuarios'

const MINIMO_LETRAS = 2
const ESPERA_DIGITACAO_MS = 250

type Estado = { tipo: 'parado' } | { tipo: 'buscando' } | { tipo: 'pronto'; jogadores: Jogador[] } | { tipo: 'erro'; mensagem: string }

// "Quem vai jogar?": busca pelo nome (a partir de 2 letras, para a lista de contas não ficar à mostra)
// e o atalho para criar uma conta nova (volta para cá depois, com a pessoa escolhida).
export default function SeletorJogador({
  titulo = 'Quem vai jogar?',
  voltarPara,
  aoEscolher,
}: {
  titulo?: string
  /** Para onde o cadastro volta, já com o jogador novo (a rota atual). */
  voltarPara: string
  aoEscolher: (jogador: Jogador) => void
}) {
  const [busca, setBusca] = useState('')
  const [estado, setEstado] = useState<Estado>({ tipo: 'parado' })
  const termo = busca.trim()

  useEffect(() => {
    if (termo.length < MINIMO_LETRAS) return
    let ativo = true
    const id = setTimeout(() => {
      setEstado({ tipo: 'buscando' })
      buscarJogadores(termo).then(
        (jogadores) => ativo && setEstado({ tipo: 'pronto', jogadores }),
        (erro: unknown) => ativo && setEstado({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : String(erro) }),
      )
    }, ESPERA_DIGITACAO_MS)
    return () => {
      ativo = false
      clearTimeout(id)
    }
  }, [termo])

  const curto = termo.length < MINIMO_LETRAS

  return (
    <section className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm" aria-labelledby="titulo-seletor">
      <h2 id="titulo-seletor" className="font-display text-xl font-semibold text-[var(--color-navy)]">
        {titulo}
      </h2>
      <label className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--color-bg)] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[var(--color-navy)]">
        <Search size={18} className="shrink-0 text-[var(--color-ink-soft)]" />
        <input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome"
          aria-label="Nome do jogador"
          className="w-full bg-transparent text-base text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-soft)]"
        />
      </label>

      <div className="mt-3 min-h-16" aria-live="polite">
        {curto && <p className="text-sm text-[var(--color-ink-soft)]">Digite pelo menos {MINIMO_LETRAS} letras do nome.</p>}
        {!curto && estado.tipo === 'buscando' && (
          <p className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <LoaderCircle size={16} className="animate-spin" /> Buscando…
          </p>
        )}
        {!curto && estado.tipo === 'erro' && <p className="text-sm text-[var(--color-warn)]">Não foi possível buscar: {estado.mensagem}</p>}
        {!curto && estado.tipo === 'pronto' && estado.jogadores.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">Ninguém encontrado com “{termo}”. Crie uma conta abaixo.</p>
        )}
        {!curto && estado.tipo === 'pronto' && estado.jogadores.length > 0 && (
          <ul className="space-y-2">
            {estado.jogadores.map((jogador) => (
              <li key={jogador.id}>
                <button
                  type="button"
                  onClick={() => aoEscolher(jogador)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl bg-[var(--color-bg)] px-4 py-3 text-left outline-none transition hover:bg-[var(--color-good-bg)] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
                >
                  <span>
                    <span className="block font-semibold text-[var(--color-ink)]">{jogador.nome}</span>
                    <span className="block text-xs text-[var(--color-ink-soft)]">{jogador.emailMascarado}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-[var(--color-navy)]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href={`/cadastro?${new URLSearchParams({ voltar: voltarPara })}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/20 px-4 py-3 text-sm font-semibold text-[var(--color-navy)] outline-none transition hover:bg-[var(--color-bg)] focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
      >
        <UserPlus size={18} /> Criar conta
      </Link>
    </section>
  )
}
