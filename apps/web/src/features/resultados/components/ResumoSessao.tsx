import { AlertTriangle } from 'lucide-react'
import type { NivelLeitura, Resumo, SecaoResumo } from '../resumo'

const NIVEIS: Record<NivelLeitura, string> = {
  adequado: 'bg-[var(--color-good-bg)] text-[var(--color-good)]',
  atencao: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  reduzido: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  'sem-dados': 'bg-[var(--color-bg)] text-[var(--color-ink-soft)]',
}

function SecaoJogo({ nomeJogo, valoresDeReferencia, linhas, leitura }: SecaoResumo) {
  return (
    <div className="mt-5 border-t border-navy/10 pt-5 first:mt-0 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-semibold text-[var(--color-navy)]">{nomeJogo}</h3>
        {valoresDeReferencia && (
          <span className="rounded-full bg-[var(--color-warn-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-warn)]">
            Valores de referência
          </span>
        )}
      </div>
      {valoresDeReferencia && (
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Este jogo não foi realizado nesta sessão. Os números abaixo são valores de referência da demonstração.
        </p>
      )}

      <dl className="mt-3 divide-y divide-navy/10">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-[var(--color-ink-soft)]">{rotulo}</dt>
            <dd className="font-display text-base font-semibold text-[var(--color-navy)]">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-xl bg-[var(--color-bg)] p-4">
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
    </div>
  )
}

// Resumo da experiência: uma seção por jogo, cada uma com os números e uma interpretação ilustrativa.
export default function ResumoSessao({ resumo }: { resumo: Resumo }) {
  return (
    <article className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm print:shadow-none">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">iris hub · resumo</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-[var(--color-navy)]">
        {resumo.participante ? `Resultado de ${resumo.participante}` : 'Resultado da experiência'}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{resumo.data}</p>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--color-warn-bg)] p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
        <p className="text-sm text-[var(--color-ink)]">
          Documento simulado para apresentação acadêmica, sem valor diagnóstico.
        </p>
      </div>

      {resumo.secoes.map((secao) => (
        <SecaoJogo key={secao.jogo} {...secao} />
      ))}
    </article>
  )
}
