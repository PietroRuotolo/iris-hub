import { AlertTriangle } from 'lucide-react'
import { interpretar } from '../services/laudo'

const NIVEIS = {
  adequado: 'bg-[var(--color-good-bg)] text-[var(--color-good)]',
  atencao: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  reduzido: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  'sem-dados': 'bg-[var(--color-bg)] text-[var(--color-ink-soft)]',
}

const formatarMs = (v) => (v === null ? null : `${Math.round(v)} ms`)
const formatarPx = (v) => (v === null ? null : `${v.toFixed(1)} px`)

function linhas(resumo) {
  const taxa = resumo.taxaAcerto === null ? null : `${Math.round(resumo.taxaAcerto * 100)}%`
  return [
    ['Sessões realizadas', String(resumo.sessoes)],
    ['Acertos', String(resumo.acertos)],
    ['Erros', String(resumo.erros)],
    ['Taxa de acerto', taxa],
    ['Tempo de resposta médio', formatarMs(resumo.tempoMedioMs)],
    ['Variabilidade do tempo de resposta', formatarMs(resumo.desvioMs)],
    ['Precisão espacial média', formatarPx(resumo.precisaoPx)],
    ['Instabilidade média da fixação', formatarPx(resumo.fixacaoPx)],
  ].filter(([, valor]) => valor !== null)
}

// Laudo SIMULADO: mostra o resumo agregado das sessões e uma interpretação ilustrativa.
export default function LaudoDocumento({ resumo, dataIso }) {
  const leitura = interpretar(resumo)
  const data = dataIso ? new Date(dataIso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) : null

  return (
    <article className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Laudo simulado</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-[var(--color-navy)]">
        Jogo de ritmo por rastreamento ocular
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Paciente: demonstração{data ? ` · ${data}` : ''}
      </p>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--color-warn-bg)] p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
        <p className="text-sm text-[var(--color-ink)]">
          Documento simulado para apresentação acadêmica. Não é um laudo real nem tem valor diagnóstico.
        </p>
      </div>

      <dl className="mt-5 divide-y divide-navy/10">
        {linhas(resumo).map(([rotulo, valor]) => (
          <div key={rotulo} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-[var(--color-ink-soft)]">{rotulo}</dt>
            <dd className="font-display text-base font-semibold text-[var(--color-navy)]">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 rounded-xl bg-[var(--color-bg)] p-4">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${NIVEIS[leitura.nivel]}`}>
          {leitura.titulo}
        </span>
        <p className="mt-3 text-sm text-[var(--color-ink)]">{leitura.texto}</p>
        {leitura.observacoes.map((obs) => (
          <p key={obs} className="mt-2 text-sm text-[var(--color-ink)]">
            • {obs}
          </p>
        ))}
      </div>
    </article>
  )
}
