import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Info, Play } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'

function Pendente({ texto }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[var(--color-warn-bg)] p-4">
      <Clock size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
      <p className="text-sm text-[var(--color-ink)]">{texto}</p>
    </div>
  )
}

function Midia({ midia }) {
  if (midia.src) {
    return (
      <video
        src={midia.src}
        controls
        preload="metadata"
        className="w-full rounded-xl bg-[var(--color-navy)]"
      />
    )
  }
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
      <Play size={32} />
      <span className="text-sm">{midia.pendente}</span>
    </div>
  )
}

function Secao({ titulo, texto, itens, ordenada, pendente, midia }) {
  const Lista = ordenada ? 'ol' : 'ul'

  return (
    <section className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">{titulo}</h2>
      <div className="mt-3 space-y-3">
        {texto && <p className="text-sm leading-relaxed text-[var(--color-ink)]">{texto}</p>}

        {itens && (
          <Lista className="space-y-2">
            {itens.map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-sm text-[var(--color-ink)]">
                {ordenada ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-navy)]">
                    {i + 1}
                  </span>
                ) : (
                  <Check size={18} className="mt-0.5 shrink-0 text-[var(--color-good)]" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </Lista>
        )}

        {midia && <Midia midia={midia} />}
        {pendente && <Pendente texto={pendente} />}
      </div>
    </section>
  )
}

// Página de cada software do hub. Todo o conteúdo vem de `software.detalhes` (src/data/softwares.js).
export default function SoftwareDetalhe({ software }) {
  const { nome, tipo, descricao, status, Icone, detalhes } = software

  return (
    <>
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar ao menu
      </Link>

      <header className="mt-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-bg)]">
            <Icone size={28} className="text-[var(--color-navy)]" />
          </div>
          <StatusBadge status={status} />
        </div>

        <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-navy)]">{nome}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{tipo}</p>
        <p className="mt-3 text-base text-[var(--color-ink)]">{descricao}</p>
      </header>

      {detalhes.aviso && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--color-good-bg)] p-5">
          <Info size={20} className="mt-0.5 shrink-0 text-[var(--color-good)]" />
          <p className="text-sm text-[var(--color-ink)]">{detalhes.aviso}</p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {detalhes.secoes.map((secao) => (
          <Secao key={secao.titulo} {...secao} />
        ))}
      </div>
    </>
  )
}
