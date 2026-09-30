import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CompartilharResumo from '@/features/resultados/components/CompartilharResumo'
import ResumoSalvo from '@/features/resultados/components/ResumoSalvo'
import { jogoDaUrl } from '@/features/resultados/historico'

// Resumo de uma sessão salva: os números vêm do banco, pelo id da URL e pelo jogo (`?jogo=reflexo`,
// `?jogo=cores`; sem parâmetro é o jogo de ritmo). Ao lado, o QR code do resumo dos 3 jogos.
export default async function PaginaResumoSessao({ params, searchParams }: PageProps<'/sessao/[id]/resumo'>) {
  const { id } = await params
  const jogo = jogoDaUrl((await searchParams).jogo)

  return (
    <>
      <Link href="/sessoes" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar às sessões
      </Link>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <ResumoSalvo id={id} jogo={jogo} />

        <CompartilharResumo />
      </div>
    </>
  )
}
