import { jogoDaUrl } from '@/features/resultados/historico'
import PaginaResumo from '@/features/resultados/components/PaginaResumo'

// Resumo de uma sessão salva: os números vêm do banco, pelo id da URL e pelo jogo (`?jogo=reflexo`,
// `?jogo=cores`; sem parâmetro é o jogo de ritmo), do jogador da URL (?jogador=). Ao lado, o QR code
// do resumo dos 3 jogos dele.
export default async function PaginaResumoSessao({ params, searchParams }: PageProps<'/sessao/[id]/resumo'>) {
  const { id } = await params
  const jogo = jogoDaUrl((await searchParams).jogo)
  return <PaginaResumo id={id} jogo={jogo} />
}
