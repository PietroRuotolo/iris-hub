import { Crown } from 'lucide-react'
import { ordenarRanking, type LinhaRanking } from '../ranking'

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

const formatarPontos = (pontos: number) => pontos.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/** Tabela NOME | PONTOS, do maior para o menor. Quem está em 1º ganha uma coroa na cabeça. */
export default function TabelaRanking({ linhas }: { linhas: LinhaRanking[] }) {
  const ordenadas = ordenarRanking(linhas)

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)] shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <th className="w-14 px-4 py-3 text-center">#</th>
            <th className="px-2 py-3">Nome</th>
            <th className="px-4 py-3 text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((linha, i) => {
            const primeiro = i === 0
            return (
              <tr key={linha.nome} className={`border-t border-[var(--color-bg)] ${primeiro ? 'bg-[var(--color-warn-bg)]' : ''}`}>
                <td className="px-4 py-4 text-center font-display text-lg font-semibold text-[var(--color-ink-soft)]">{i + 1}</td>
                {/* O 1º tem mais espaço em cima: a coroa fica inteira, sem encostar no cabeçalho. */}
                <td className={`px-2 ${primeiro ? 'pt-7 pb-4' : 'py-4'}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
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
                    <span className={`text-base text-[var(--color-ink)] ${primeiro ? 'font-semibold' : ''}`}>{linha.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-display text-lg font-semibold tabular-nums text-[var(--color-navy)]">{formatarPontos(linha.pontos)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
