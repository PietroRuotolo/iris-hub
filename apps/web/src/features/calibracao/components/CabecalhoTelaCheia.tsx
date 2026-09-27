import type { Retangulo } from '../layout'

// Título, barra de progresso e instrução, fixos no centro da faixa do topo (calibração e fases).
export default function CabecalhoTelaCheia({
  titulo,
  atual,
  total,
  rotulo,
  instrucao,
  posicao,
}: {
  titulo: string
  atual: number
  total: number
  rotulo: string
  instrucao: string
  posicao: Retangulo
}) {
  return (
    <div
      className="fixed flex flex-col items-center justify-center gap-2 text-center"
      style={{ left: posicao.x, top: posicao.y, width: posicao.largura, height: posicao.altura }}
    >
      <h1 className={`font-display font-semibold leading-tight text-[var(--color-navy)] ${posicao.altura < 110 ? 'text-base' : 'text-xl'}`}>{titulo}</h1>
      <div className="flex w-full items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-navy/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={atual}
        >
          <div
            className="h-full rounded-full bg-[var(--color-warn)] transition-[width] duration-300"
            style={{ width: `${(Math.min(atual, total) / total) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm text-[var(--color-ink-soft)]">
          {rotulo} <strong className="text-[var(--color-ink)]">{Math.min(atual, total)}</strong> de {total}
        </span>
      </div>
      <p className={`text-[var(--color-ink-soft)] ${posicao.altura < 110 ? 'text-xs leading-snug' : 'text-sm'}`}>{instrucao}</p>
    </div>
  )
}
