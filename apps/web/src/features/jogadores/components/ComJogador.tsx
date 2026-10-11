'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, LoaderCircle, Repeat2, UserRound } from 'lucide-react'
import Historia from '@/features/historia/components/Historia'
import { ErroApi, definirJogadorDaApi } from '@/lib/api/http'
import { marcarHistoriaVista, obterJogador, type Jogador } from '@/lib/api/usuarios'
import { PARAMETRO_JOGADOR, urlComJogador, urlSemJogador } from '../url'
import SeletorJogador from './SeletorJogador'

type Resultado = { id: string } & ({ tipo: 'ok'; jogador: Jogador } | { tipo: 'naoEncontrado' } | { tipo: 'erro'; mensagem: string })

interface Props {
  /** Título da escolha ("Quem vai jogar?", "De quem são as partidas?"). */
  titulo?: string
  /** A história de introdução é obrigatória antes da 1ª partida de cada pessoa. */
  exigirHistoria?: boolean
  /** Página de tela cheia (sem menu): centraliza a escolha e não mostra a faixa do jogador. */
  telaCheia?: boolean
  children: ReactNode | ((jogador: Jogador) => ReactNode)
}

/**
 * Não há login: as telas que dependem de uma pessoa (jogos, sessões, resumo) ficam dentro deste
 * componente. Ele lê o jogador da URL (?jogador=), confere que a conta existe, faz as chamadas à API
 * irem com ele e, se faltar, mostra a escolha "Quem vai jogar?".
 */
export default function ComJogador(props: Props) {
  return (
    <Suspense fallback={<Carregando telaCheia={props.telaCheia} />}>
      <ComJogadorDaUrl {...props} />
    </Suspense>
  )
}

function ComJogadorDaUrl({ titulo, exigirHistoria = false, telaCheia = false, children }: Props) {
  const router = useRouter()
  const caminho = usePathname()
  const params = useSearchParams()
  const id = params.get(PARAMETRO_JOGADOR)
  const urlAtual = params.size ? `${caminho}?${params}` : caminho
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [historiaFeita, setHistoriaFeita] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let ativo = true
    obterJogador(id).then(
      (jogador) => {
        if (!ativo) return
        // Antes de mostrar a tela: as chamadas que ela fizer ao montar já vão com o jogador.
        definirJogadorDaApi(jogador.id)
        setResultado({ id, tipo: 'ok', jogador })
      },
      (erro: unknown) => {
        if (!ativo) return
        if (erro instanceof ErroApi && erro.status === 404) setResultado({ id, tipo: 'naoEncontrado' })
        else setResultado({ id, tipo: 'erro', mensagem: erro instanceof Error ? erro.message : String(erro) })
      },
    )
    return () => {
      ativo = false
    }
  }, [id])

  // Ao sair da página (ou trocar de pessoa), as chamadas param de levar o jogador.
  useEffect(() => () => definirJogadorDaApi(null), [])

  const escolher = (jogador: Jogador) => router.replace(urlComJogador(urlAtual, jogador.id))
  const trocar = () => {
    definirJogadorDaApi(null)
    router.replace(urlSemJogador(urlAtual))
  }
  const envolver = (conteudo: ReactNode) => (telaCheia ? <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">{conteudo}</div> : conteudo)

  const atual = resultado?.id === id ? resultado : null

  if (!id || atual?.tipo === 'naoEncontrado') {
    return envolver(
      <>
        {atual?.tipo === 'naoEncontrado' && (
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-[var(--color-warn-bg)] px-4 py-3 text-sm text-[var(--color-ink)]" role="alert">
            <AlertTriangle size={16} className="shrink-0 text-[var(--color-warn)]" /> Jogador não encontrado. Escolha de novo.
          </p>
        )}
        <SeletorJogador titulo={titulo} voltarPara={urlSemJogador(urlAtual)} aoEscolher={escolher} />
      </>,
    )
  }

  if (!atual) return <Carregando telaCheia={telaCheia} />

  if (atual.tipo === 'erro') {
    return envolver(
      <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-5" role="alert">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
        <div>
          <p className="text-sm text-[var(--color-ink)]">Não foi possível conferir o jogador: {atual.mensagem}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-2 cursor-pointer text-sm font-medium text-[var(--color-navy)] underline">
            Tentar de novo
          </button>
        </div>
      </div>,
    )
  }

  const { jogador } = atual
  if (exigirHistoria && !jogador.historiaVista && historiaFeita !== jogador.id) {
    return (
      <Historia
        modo="obrigatoria"
        aoTerminar={() => {
          setHistoriaFeita(jogador.id)
          void marcarHistoriaVista(jogador.id).catch(() => undefined)
        }}
      />
    )
  }

  const conteudo = typeof children === 'function' ? children(jogador) : children
  if (telaCheia) return conteudo

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-2.5 shadow-sm">
        <p className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-ink)]">
          <UserRound size={16} className="shrink-0 text-[var(--color-navy)]" />
          <span className="truncate">
            Jogador: <strong>{jogador.nome}</strong>
          </span>
        </p>
        <button
          type="button"
          onClick={trocar}
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-bg)]"
        >
          <Repeat2 size={16} /> Trocar
        </button>
      </div>
      {conteudo}
    </>
  )
}

function Carregando({ telaCheia }: { telaCheia?: boolean }) {
  return (
    <p className={`flex items-center justify-center gap-2 text-sm text-[var(--color-ink-soft)] ${telaCheia ? 'min-h-screen' : 'py-10'}`} role="status">
      <LoaderCircle size={16} className="animate-spin" /> Carregando…
    </p>
  )
}
