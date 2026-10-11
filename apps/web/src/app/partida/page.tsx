import PartidaJogo from '@/features/jogo-ritmo/components/PartidaJogo'
import ComJogador from '@/features/jogadores/components/ComJogador'

// Tela cheia (sem menu): calibração e fases usam o viewport inteiro para os alvos. A partida é de um
// jogador escolhido (?jogador=); na 1ª vez dele, a introdução vem antes.
export default function Partida() {
  return (
    <ComJogador exigirHistoria telaCheia>
      <PartidaJogo />
    </ComJogador>
  )
}
