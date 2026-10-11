import { AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import BotaoPdf from '@/features/resultados/components/BotaoPdf'
import ResumoSessao from '@/features/resultados/components/ResumoSessao'
import { resumoCompartilhado } from '@/features/resultados/resumo'
import { buscarResumoCompartilhado } from '@/lib/server/resumos'

// Página aberta pelo QR code no celular (tela cheia, sem menu e sem login). O token do link (?t=)
// abre o resumo guardado no banco, com a última partida de cada jogo da pessoa.
export const dynamic = 'force-dynamic'

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-5" role="alert">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
      <div>
        <p className="font-display font-semibold text-[var(--color-navy)]">{titulo}</p>
        <p className="mt-1 text-sm text-[var(--color-ink)]">{texto}</p>
      </div>
    </div>
  )
}

export default async function Resultado({ searchParams }: PageProps<'/resultado'>) {
  const t = (await searchParams).t
  const token = Array.isArray(t) ? t[0] : t
  const busca = token ? await buscarResumoCompartilhado(token) : null

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 py-6 print:max-w-none print:bg-white">
      <div className="mb-4">
        <Image src="/logo/iris-hubs-logo-azul-sem-fundo.svg" alt="Iris Hubs" width={120} height={35} />
      </div>

      {!busca && <Aviso titulo="Link incompleto" texto="Abra este endereço pelo QR code mostrado no computador do iris hub." />}
      {busca?.tipo === 'inexistente' && (
        <Aviso titulo="Link inválido ou vencido" texto="Peça para gerar um novo QR code no computador do iris hub." />
      )}
      {busca?.tipo === 'erro' && <Aviso titulo="Não foi possível abrir o resumo" texto={`${busca.mensagem}. Tente de novo em instantes.`} />}

      {busca?.tipo === 'ok' && (
        <>
          <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm print:hidden">
            <h1 className="font-display text-xl font-semibold text-[var(--color-navy)]">Seu resumo está pronto</h1>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              Toque no botão e escolha <strong>Salvar como PDF</strong> para guardar ou compartilhar.
            </p>
            <BotaoPdf />
          </div>
          <div className="mt-4 print:mt-0">
            <ResumoSessao resumo={resumoCompartilhado(busca.resumo)} />
          </div>
        </>
      )}
    </div>
  )
}
