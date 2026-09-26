import ApresentacaoJogo from '@/features/jogo-ritmo/components/ApresentacaoJogo'
import { JOGOS } from '@/features/jogo-ritmo/jogos'

export default function Jogo() {
  return <ApresentacaoJogo jogo={JOGOS[0]} />
}
