import { Crown } from 'lucide-react'
import type { LinhaRankingGeral } from '@iris/contracts'
import { formatarNota, iniciais } from '../ranking'

/**
 * A tabela do ranking: posição, nome, a nota de cada jogo e a nota geral (já vem em ordem). Quem está em
 * 1º ganha uma coroa. No celular, as notas dos jogos ficam embaixo do nome.
 */
export default function TabelaRanking({ linhas }: { linhas: LinhaRankingGeral[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <th className="w-14 px-4 py-3 text-center">#</th>
            <th className="px-2 py-3">Nome</th>
            <th className="hidden px-3 py-3 text-right sm:table-cell">Ritmo</th>
            <th className="hidden px-3 py-3 text-right sm:table-cell">Reflexo</th>
            <th className="hidden px-3 py-3 text-right sm:table-cell">Cores</th>
            <th className="px-4 py-3 text-right">Geral</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => {
            const primeiro = linha.posicao === 1
            return (
              <tr key={linha.jogadorId} className={`border-t border-[var(--color-bg)] ${primeiro ? 'bg-[var(--color-warn-bg)]' : ''}`}>
                <td className="px-4 py-4 text-center font-display text-lg font-semibold text-[var(--color-ink-soft)]">{linha.posicao}</td>
                {/* O 1º tem mais espaço em cima: a coroa fica inteira, sem encostar no cabeçalho. */}
                <td className={`px-2 ${primeiro ? 'pt-7 pb-4' : 'py-4'}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {primeiro && (
                        <Crown
                          size={24}
                          aria-label="Primeiro lugar"
                          className="absolute -top-5 left-1/2 -translate-x-1/2 -rotate-12 fill-[var(--color-warn)] text-[var(--color-warn)]"
                        />
                      )}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          primeiro ? 'bg-[var(--color-navy)] text-[var(--color-surface)]' : 'bg-[var(--color-bg)] text-[var(--color-navy)]'
                        }`}
                      >
                        {iniciais(linha.nome)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-base text-[var(--color-ink)] ${primeiro ? 'font-semibold' : ''}`}>{linha.nome}</p>
                      <p className="flex flex-wrap gap-x-2 text-xs tabular-nums text-[var(--color-ink-soft)] sm:hidden">
                        <span className="whitespace-nowrap">Ritmo {formatarNota(linha.ritmo)}</span>
                        <span className="whitespace-nowrap">Reflexo {formatarNota(linha.reflexo)}</span>
                        <span className="whitespace-nowrap">Cores {formatarNota(linha.cores)}</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-4 text-right tabular-nums text-[var(--color-ink)] sm:table-cell">{formatarNota(linha.ritmo)}</td>
                <td className="hidden px-3 py-4 text-right tabular-nums text-[var(--color-ink)] sm:table-cell">{formatarNota(linha.reflexo)}</td>
                <td className="hidden px-3 py-4 text-right tabular-nums text-[var(--color-ink)] sm:table-cell">{formatarNota(linha.cores)}</td>
                <td className="px-4 py-4 text-right font-display text-lg font-semibold tabular-nums text-[var(--color-navy)]">{formatarNota(linha.geral)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}