'use client'

import { ArrowLeft, ArrowRight, Check, Info } from 'lucide-react'
import { JOGO_REFLEXO, STATUS_JOGO } from '../reflexo.config'

interface Props {
  onComecar: () => void
  onVoltar?: () => void
}

export default function ApresentacaoReflexo({ onComecar, onVoltar }: Props) {
  const jogo = JOGO_REFLEXO
  const statusInfo = STATUS_JOGO[jogo.status]
  const Icone = jogo.Icone

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Botão Voltar */}
      <button
        type="button"
        onClick={onVoltar ?? (() => window.history.back())}
        className="flex w-fit items-center gap-2 text-sm font-medium text-[var(--color-ink-soft,#64748b)] transition hover:text-[var(--color-navy,#0f172a)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao menu
      </button>

      {/* Cartão Cabeçalho */}
      <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[var(--color-navy,#0f172a)]">
            <Icone className="h-6 w-6" />
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.classes}`}>
            {statusInfo.label}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-navy,#0f172a)]">
          {jogo.nome}
        </h1>
        <p className="text-sm font-medium text-[var(--color-ink-soft,#64748b)]">{jogo.tipo}</p>
        <p className="mt-2 text-sm text-[var(--color-ink,#334155)]">{jogo.descricao}</p>
      </div>

      {/* Caixa de Aviso Verde */}
      {jogo.apresentacao.aviso && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="leading-relaxed">{jogo.apresentacao.aviso}</p>
        </div>
      )}

      {/* Seções de Texto (O que é, Jogar, Como Funciona) */}
      {jogo.apresentacao.secoes.map((secao) => (
        <div
          key={secao.titulo}
          className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-white p-6 shadow-sm"
        >
          <h2 className="text-base font-bold text-[var(--color-navy,#0f172a)]">{secao.titulo}</h2>

          {secao.texto && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink,#334155)]">
              {secao.texto}
            </p>
          )}

          {/* Listas Numeradas */}
          {secao.itens && secao.ordenada && (
            <ol className="mt-4 space-y-3 text-sm text-[var(--color-ink,#334155)]">
              {secao.itens.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-800">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          )}

          {/* Listas com Visto (✔) */}
          {secao.itens && !secao.ordenada && (
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink,#334155)]">
              {secao.itens.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Botão Começar Partida */}
          {secao.link && (
            <div className="mt-6">
              <button
                type="button"
                onClick={onComecar}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy,#0f2a4a)] px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[var(--color-navy-dark,#0a1c31)] cursor-pointer"
              >
                {secao.link.label}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}