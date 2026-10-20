'use client'

import { ArrowLeft, ArrowRight, Hand, Pointer, type LucideIcon } from 'lucide-react'
import { STATUS_JOGO, jogoPorChave } from '@/lib/jogos'
import { TOTAL_FASES } from '../fases'
import anima from './apresentacao.module.css'

interface Props {
  onComecar: () => void
  onVoltar?: () => void
}

// Tela de apresentação do jogo do reflexo ("o mestre mandou"): o que é, as duas ordens e o botão de começar.
export default function ApresentacaoReflexo({ onComecar, onVoltar }: Props) {
  const jogo = jogoPorChave('reflexo')
  const status = STATUS_JOGO[jogo.status]

  return (
    <div className="flex w-full flex-col gap-8">
      <button
        type="button"
        onClick={onVoltar ?? (() => window.history.back())}
        className="inline-flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-navy)]"
      >
        <ArrowLeft size={16} /> Voltar ao menu
      </button>

      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-5xl">O mestre mandou</h1>
          <p className="max-w-md text-base leading-relaxed text-[var(--color-ink-soft)]">
            Em cada fase, o mestre manda apertar o botão do ESP32 o mais rápido possível, ou não apertar.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <Ordem Icone={Pointer} animacao={anima.apertando} titulo="APERTE!" texto="o mais rápido que puder" className="bg-[var(--color-navy)]" />
          <Ordem Icone={Hand} animacao={anima.segurando} titulo="NÃO APERTE!" texto="segure até o tempo acabar" className="bg-[var(--color-terracota)]" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onComecar}
            className="group inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-2xl bg-[var(--color-navy)] px-8 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition hover:shadow-md focus-visible:ring-4 focus-visible:ring-[var(--color-navy)]/25"
          >
            Começar teste
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {TOTAL_FASES} fases · cerca de 1 minuto · caixa do ESP32 na USB (Chrome ou Edge)
          </p>
        </div>
      </section>
    </div>
  )
}

function Ordem({ Icone, animacao, titulo, texto, className }: { Icone: LucideIcon; animacao: string; titulo: string; texto: string; className: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl px-4 py-6 text-[var(--color-surface)] ${className}`}>
      <Icone size={36} strokeWidth={1.75} className={animacao} aria-hidden="true" />
      <p className="font-display text-lg font-extrabold tracking-tight sm:text-xl">{titulo}</p>
      <p className="text-sm opacity-80">{texto}</p>
    </div>
  )
}