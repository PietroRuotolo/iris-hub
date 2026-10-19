import { Check, Hand, X } from 'lucide-react'
import type { ResultadoRodada, RodadaReflexo } from '@iris/contracts'
import { TOTAL_FASES } from '../fases'
import estilos from './reflexo.module.css'

const ROTULO_ERRO: Record<Exclude<ResultadoRodada, 'acerto' | 'segurou'>, string> = {
  atrasado: 'demorou',
  apertou_errado: 'apertou',
  antecipacao: 'cedo',
}

/** As 5 fases como uma trilha: as jogadas mostram o resultado, a atual pulsa e as próximas esperam. */
export default function Trilha({ rodadas, atual }: { rodadas: RodadaReflexo[]; atual: number | null }) {
  return (
    <ol className="relative grid grid-cols-5 gap-1" aria-label="Fases">
      {/* A linha que liga as fases, atrás das bolinhas, e quanto dela já foi jogado. */}
      <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-navy/10" />
      <span
        aria-hidden="true"
        className="absolute left-[10%] top-5 h-0.5 bg-[var(--color-good)] transition-[width] duration-500"
        style={{ width: `${(Math.max(0, rodadas.length - 1) / (TOTAL_FASES - 1)) * 80}%` }}
      />
      {Array.from({ length: TOTAL_FASES }, (_, i) => {
        const r = rodadas[i]
        const ehAtual = atual === i + 1 && !r
        const certo = r?.resultado === 'acerto' || r?.resultado === 'segurou'
        return (
          <li key={i} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={ehAtual ? 'step' : undefined}>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-semibold transition-colors duration-300 ${
                r
                  ? certo
                    ? 'bg-[var(--color-good)] text-[var(--color-surface)]'
                    : 'bg-[var(--color-warn)] text-[var(--color-surface)]'
                  : ehAtual
                    ? `bg-[var(--color-navy)] text-[var(--color-surface)] ${estilos.atual}`
                    : 'bg-[var(--color-surface)] text-[var(--color-ink-soft)] ring-1 ring-navy/10'
              }`}
            >
              {!r ? i + 1 : r.resultado === 'segurou' ? <Hand size={18} /> : certo ? <Check size={18} /> : <X size={18} />}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${r ? (certo ? 'text-[var(--color-good)]' : 'text-[var(--color-warn)]') : 'text-[var(--color-ink-soft)]'}`}
            >
              {!r ? `Fase ${i + 1}` : r.resultado === 'acerto' ? `${r.tempoReacaoMs} ms` : r.resultado === 'segurou' ? 'segurou' : ROTULO_ERRO[r.resultado]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}