import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Hand, LoaderCircle, Pointer, RotateCcw, X } from 'lucide-react'
import { pontuarRodada, resumirReflexo, type ResultadoRodada, type RodadaReflexo } from '@iris/contracts'
import { TOTAL_FASES } from '../fases'

const ms = (v: number | null) => (v === null ? '—' : `${Math.round(v)} ms`)

const TEXTO: Record<ResultadoRodada, string> = {
  acerto: 'Apertou',
  segurou: 'Segurou',
  atrasado: 'Demorou',
  apertou_errado: 'Apertou sem poder',
  antecipacao: 'Cedo demais',
}

/** A gravação da partida no banco. 'nada': nenhuma fase jogada, não há o que gravar. */
export type Salvamento = 'nada' | 'salvando' | 'salva' | 'erro'

// Resultado da partida (versão simples; o painel completo vem no próximo passo).
export default function ResultadoReflexo({
  rodadas,
  salvamento,
  aoTentarSalvar,
  onVoltar,
  onJogarDeNovo,
}: {
  rodadas: RodadaReflexo[]
  salvamento: Salvamento
  aoTentarSalvar: () => void
  onVoltar?: () => void
  onJogarDeNovo: () => void
}) {
  const r = resumirReflexo(rodadas)

  return (
    <div className="flex w-full flex-col gap-4">
      {onVoltar && (
        <button type="button" onClick={onVoltar} className="inline-flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
          <ArrowLeft size={16} /> Voltar
        </button>
      )}
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">{rodadas.length === TOTAL_FASES ? 'Partida concluída' : 'Partida encerrada'}</h1>
      <EstadoSalvamento salvamento={salvamento} aoTentarSalvar={aoTentarSalvar} />

      <section className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <p className="font-display text-4xl font-semibold text-[var(--color-good)]">
          {Math.round(r.pontos)}
          <span className="text-lg text-[var(--color-ink-soft)]"> / {TOTAL_FASES * 100}</span>
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {r.acertos + r.segurou} de {rodadas.length} certas · reação média {ms(r.tempoMedioMs)} · melhor {ms(r.melhorTempoMs)}
        </p>

        {rodadas.length > 0 && (
          <ul className="mt-4 divide-y divide-navy/10">
            {rodadas.map((x) => {
              const certo = x.resultado === 'acerto' || x.resultado === 'segurou'
              return (
                <li key={x.numero} className="flex items-center gap-3 py-2.5 text-sm text-[var(--color-ink)]">
                  <span className="w-14 shrink-0 text-[var(--color-ink-soft)]">Fase {x.numero}</span>
                  <span className="flex w-32 shrink-0 items-center gap-1.5 font-medium">
                    {x.ordem === 'apertar' ? <Pointer size={15} /> : <Hand size={15} />}
                    {x.ordem === 'apertar' ? 'Aperte!' : 'Não aperte!'}
                  </span>
                  <span className={`flex min-w-0 flex-1 items-center gap-1.5 ${certo ? 'text-[var(--color-good)]' : 'text-[var(--color-warn)]'}`}>
                    {certo ? <Check size={15} /> : <X size={15} />}
                    {TEXTO[x.resultado]}
                    {x.resultado === 'acerto' && <span className="tabular-nums text-[var(--color-ink)]">· {x.tempoReacaoMs} ms</span>}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{Math.round(pontuarRodada(x))}</span>
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
function EstadoSalvamento({ salvamento, aoTentarSalvar }: { salvamento: Salvamento; aoTentarSalvar: () => void }) {
  if (salvamento === 'nada') return null
  if (salvamento === 'salvando') {
    return (
      <p className="-mt-2 flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)]" role="status">
        <LoaderCircle size={16} className="animate-spin" /> Salvando a partida…
      </p>
    )
  }
  if (salvamento === 'salva') {
    return (
      <p className="-mt-2 flex items-center gap-1.5 text-sm text-[var(--color-good)]" role="status">
        <CheckCircle2 size={16} /> Partida salva
      </p>
    )
  }
  return (
    <div className="-mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-warn-bg)] px-3 py-2 text-sm text-[var(--color-warn)]" role="alert">
      <AlertTriangle size={16} /> Não foi possível salvar a partida.
      <button type="button" onClick={aoTentarSalvar} className="cursor-pointer font-semibold underline underline-offset-2">
        Tentar de novo
      </button>
    </div>
  )
}