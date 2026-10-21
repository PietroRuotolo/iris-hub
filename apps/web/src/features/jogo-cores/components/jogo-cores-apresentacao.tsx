'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { STATUS_JOGO, jogoPorChave } from '@/lib/jogos'
import { CORES_JOGO } from '../cores.config'
import { TOTAL_FASES } from '../fases'
import estilos from './cores.module.css'

interface Props {
  onIniciar: () => void
  onVoltar?: () => void
}

// Tela de apresentação do jogo das cores: o que é, as 5 cores e o botão de começar.
export default function JogoCoresApresentacao({ onIniciar, onVoltar }: Props) {
  const jogo = jogoPorChave('cores')
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
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[var(--color-navy)] sm:text-5xl">Siga as cores</h1>
          <p className="max-w-md text-base leading-relaxed text-[var(--color-ink-soft)]">
            As cores acendem numa sequência. Repita nos botões do ESP32, na mesma ordem, o mais rápido que puder.
          </p>
        </div>

        <div className="flex items-end justify-center gap-3 sm:gap-4" aria-hidden="true">
          {CORES_JOGO.map((c, i) => (
            <span
              key={c.id}
              className={`h-14 w-14 rounded-2xl sm:h-16 sm:w-16 ${estilos.botao} ${i === 2 ? estilos.aceso : ''}`}
              style={{ background: c.cor, ['--cor' as string]: c.cor }}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onIniciar}
            className="group inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-2xl bg-[var(--color-navy)] px-8 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition hover:shadow-md focus-visible:ring-4 focus-visible:ring-[var(--color-navy)]/25"
          >
            Começar teste
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {TOTAL_FASES} fases · de 3 a 7 cores · caixa do ESP32 na USB (Chrome ou Edge)
          </p>
        </div>
      </section>
    </div>
  )
}