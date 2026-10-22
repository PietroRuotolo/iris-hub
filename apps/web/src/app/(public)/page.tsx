import PainelRanking from '@/features/ranking/components/PainelRanking'

// Tela inicial: o ranking geral dos três jogos.
export default function Ranking() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Ranking</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        A nota geral é a média das notas de 0 a 100 dos três jogos, contando a melhor partida de cada um. Só entra quem jogou os 3.
      </p>
      <div className="mt-6">
        <PainelRanking />
      </div>
    </>
  )
}