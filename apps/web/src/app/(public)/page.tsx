import CartaoJogo from '@/features/jogo-ritmo/components/CartaoJogo'
import { JOGOS } from '@/lib/jogos'

export default function Inicio() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {JOGOS.map((jogo, i) => (
        <CartaoJogo key={jogo.id} chave={jogo.chave} atraso={i * 80} />
      ))}
    </div>
  )
}
