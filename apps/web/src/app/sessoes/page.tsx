import Link from 'next/link'
import { Clock, Download, FileText, Upload } from 'lucide-react'
import { JOGOS } from '@/features/jogo-ritmo/jogos'

// Só o layout: ainda não carrega arquivos nem guarda sessões (mostra o estado sem sessões).
export default function Sessoes() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Sessões</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        A pessoa passa por cada jogo da experiência; carregue aqui o arquivo JSON que cada um exporta ao final. Quando
        todos estiverem carregados, gere o resumo combinando os resultados.
      </p>

      <ul className="mt-4 space-y-2">
        {JOGOS.map((jogo) => (
          <li key={jogo.id} className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4 shadow-sm">
            <Clock size={18} className="shrink-0 text-[var(--color-warn)]" />
            <span className="text-sm text-[var(--color-ink)]">{jogo.nome} — aguardando sessão</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-4 text-base font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 active:scale-[0.99]"
        >
          <Upload size={20} /> Carregar sessão (JSON)
        </button>
        <a
          href="/sessao-exemplo.json"
          download
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]"
        >
          <Download size={16} /> Baixar arquivo de exemplo
        </a>
      </div>

      <h2 className="mt-6 font-display text-lg font-semibold text-[var(--color-navy)]">Sessões carregadas (0)</h2>
      <p className="mt-3 rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)] shadow-sm">
        Nenhuma sessão ainda.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/sessao/exemplo/resumo"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-good)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
        >
          <FileText size={18} /> Gerar resumo
        </Link>
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        Sem sessões carregadas, o resumo sai com valores de referência para todos os jogos.
      </p>
    </>
  )
}
