import { ArrowLeft, Check, Clock, RotateCcw, X } from 'lucide-react'
import { pontuarFaseCores, resumirFasesCores, type FaseCores, type ResultadoFaseCores } from '@iris/contracts'
import { CORES_JOGO } from '../cores.config'
import { TOTAL_FASES } from '../fases'

const TEXTO: Record<ResultadoFaseCores, string> = {
  acerto: 'Acertou',
  errou: 'Errou a ordem',
  demorou: 'O tempo acabou',
}

// Resultado da partida das cores: os pontos e como foi cada fase.
export default function ResultadoCores({ fases, onVoltar, onJogarDeNovo }: { fases: FaseCores[]; onVoltar?: () => void; onJogarDeNovo: () => void }) {
  const r = resumirFasesCores(fases)

  return (
    <div className="flex w-full flex-col gap-4">
      {onVoltar && (
        <button type="button" onClick={onVoltar} className="inline-flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
          <ArrowLeft size={16} /> Voltar
        </button>
      )}
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">{fases.length === TOTAL_FASES ? 'Partida concluída' : 'Partida encerrada'}</h1>

      <section className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <p className="font-display text-4xl font-semibold text-[var(--color-good)]">
          {r.pontos}
          <span className="text-lg text-[var(--color-ink-soft)]"> / {TOTAL_FASES * 100}</span>
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {r.acertos} de {fases.length} certas · maior sequência {r.maiorSequencia || '—'}
          {r.ritmoMedioPorCorMs !== null && <> · {r.ritmoMedioPorCorMs} ms por cor</>}
        </p>

        {fases.length > 0 && (
          <ul className="mt-4 divide-y divide-navy/10">
            {fases.map((f) => {
              const certo = f.resultado === 'acerto'
              return (
                <li key={f.numero} className="flex items-center gap-3 py-2.5 text-sm text-[var(--color-ink)]">
                  <span className="w-14 shrink-0 text-[var(--color-ink-soft)]">Fase {f.numero}</span>
                  <span className="flex shrink-0 gap-1" aria-label={f.sequencia.map((c) => CORES_JOGO[c].nome).join(', ')}>
                    {f.sequencia.map((c, i) => (
                      <span key={i} className="h-3.5 w-3.5 rounded" style={{ background: CORES_JOGO[c].cor }} />
                    ))}
                  </span>
                  <span className={`flex min-w-0 flex-1 items-center gap-1.5 ${certo ? 'text-[var(--color-good)]' : 'text-[var(--color-warn)]'}`}>
                    {certo ? <Check size={15} /> : f.resultado === 'demorou' ? <Clock size={15} /> : <X size={15} />}
                    <span className="truncate">{TEXTO[f.resultado]}</span>
                    {certo && f.tempoRespostaMs !== null && (
                      <span className="hidden tabular-nums text-[var(--color-ink)] sm:inline">· {Math.round(f.tempoRespostaMs / f.sequencia.length)} ms/cor</span>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{pontuarFaseCores(f)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={onJogarDeNovo}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-base font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2"
      >
        <RotateCcw size={18} /> Jogar de novo
      </button>
    </div>
  )
}