import TabelaRanking from '@/features/ranking/components/TabelaRanking'
import { MOCK_RANKING } from '@/features/ranking/ranking'

// Tela inicial: o ranking. Por enquanto com dados de exemplo (a pontuação final ainda não é gravada).
export default function Ranking() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Ranking</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Dados de exemplo: a pontuação final ainda não é calculada.</p>
      <div className="mt-6">
        <TabelaRanking linhas={MOCK_RANKING} />
      </div>
    </>
  )
}
