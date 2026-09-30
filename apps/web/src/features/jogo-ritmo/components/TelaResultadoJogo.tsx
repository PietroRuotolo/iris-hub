import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, LoaderCircle, RotateCcw } from 'lucide-react'
import { resumirSessao, type CalibracaoSessao, type FaseResumo } from '@iris/contracts'

export type EstadoSalvamento = { tipo: 'salvando' } | { tipo: 'salvo' } | { tipo: 'erro'; mensagem: string }

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

function Salvamento({ estado, sessaoId }: { estado: EstadoSalvamento; sessaoId: string | null }) {
  if (estado.tipo === 'salvando') {
    return (
      <p className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
        <LoaderCircle size={16} className="animate-spin" /> Salvando resultados…
      </p>
    )
  }
  if (estado.tipo === 'salvo') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-sm text-[var(--color-good)]">
          <CheckCircle2 size={16} /> Resultados salvos na sua conta.
        </p>
        {sessaoId && (
          <Link
            href={`/sessao/${encodeURIComponent(sessaoId)}/resumo`}
            className="text-sm font-medium text-[var(--color-navy)] underline"
          >
            Ver o resumo salvo
          </Link>
        )}
      </div>
    )
  }
  return (
    <p className="flex items-start gap-2 text-sm text-[var(--color-warn)]">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Não foi possível salvar: {estado.mensagem}
    </p>
  )
}

// Fim da partida: pontuação geral (média das fases), cada fase e a qualidade dos dados.
export default function TelaResultadoJogo({
  fases,
  calibracao,
  concluida,
  salvamento,
  sessaoId,
  aoJogarDeNovo,
}: {
  fases: FaseResumo[]
  calibracao: CalibracaoSessao | null
  concluida: boolean
  salvamento: EstadoSalvamento
  sessaoId: string | null
  aoJogarDeNovo: () => void
}) {
  const { pontuacaoTotal, coberturaTotal } = resumirSessao(fases)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/jogo" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar ao jogo de ritmo
      </Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-navy)]">
        {concluida ? 'Partida concluída' : 'Partida interrompida'}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        {fases.length} de 5 fases jogadas. Mostra o desempenho nesta partida, não é um diagnóstico.
      </p>

      <div className="mt-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="rounded-xl bg-[var(--color-good-bg)] p-4">
          <p className="font-display text-4xl font-semibold text-[var(--color-good)]">
            {pontuacaoTotal === null ? '—' : Math.round(pontuacaoTotal)}
            <span className="text-lg text-[var(--color-ink-soft)]"> / 100</span>
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink)]">Pontuação geral: média das fases jogadas.</p>
        </div>

        {fases.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-[var(--color-ink-soft)]">
                  <th className="pb-2">Fase</th>
                  <th className="pb-2 text-right">Pontos</th>
                  <th className="pb-2 text-right">Acertos</th>
                  <th className="pb-2 text-right">Rastreamento</th>
                </tr>
              </thead>
              <tbody>
                {fases.map((f) => (
                  <tr key={f.fase} className="border-t border-navy/10 text-[var(--color-ink)]">
                    <td className="py-2">
                      {f.fase}. {f.nome}
                    </td>
                    <td className="py-2 text-right font-semibold">{Math.round(f.pontuacao)}</td>
                    <td className="py-2 text-right">
                      {f.acertos}/{f.alvosApresentados}
                    </td>
                    <td className="py-2 text-right">{pct(f.coberturaRastreamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-[var(--color-bg)] p-3">
            <dt className="text-xs text-[var(--color-ink-soft)]">Qualidade da calibração</dt>
            <dd className="mt-1 font-semibold text-[var(--color-ink)]">
              {pct(calibracao?.qualidade ?? null)}
              {calibracao?.erroMedioPx != null && (
                <span className="font-normal text-[var(--color-ink-soft)]"> · erro {Math.round(calibracao.erroMedioPx)} px</span>
              )}
            </dd>
          </div>
          <div className="rounded-xl bg-[var(--color-bg)] p-3">
            <dt className="text-xs text-[var(--color-ink-soft)]">Tempo com o olhar rastreado</dt>
            <dd className="mt-1 font-semibold text-[var(--color-ink)]">{pct(coberturaTotal)}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <Salvamento estado={salvamento} sessaoId={sessaoId} />
        </div>
      </div>

      <button
        type="button"
        onClick={aoJogarDeNovo}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2"
      >
        <RotateCcw size={18} /> Jogar de novo
      </button>
    </div>
  )
}
