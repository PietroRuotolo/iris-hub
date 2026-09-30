import ApresentacaoJogo from '@/features/jogo-ritmo/components/ApresentacaoJogo'
import { JOGOS } from '@/lib/jogos'

export default function Jogo() {
  return <ApresentacaoJogo jogo={JOGOS[0]} />
}
