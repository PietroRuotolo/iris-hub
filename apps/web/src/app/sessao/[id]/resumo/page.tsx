import Link from 'next/link'
import { ArrowLeft, QrCode, RotateCcw } from 'lucide-react'
import BotaoAcao from '@/components/BotaoAcao'
import ResumoSalvo from '@/features/resultados/components/ResumoSalvo'

// Resumo de uma sessão salva: os números vêm do banco, pelo id da URL. O QR code ao lado ainda é
// um espaço reservado.
export default async function PaginaResumoSessao({ params }: PageProps<'/sessao/[id]/resumo'>) {
  const { id } = await params

  return (
    <>
      <Link href="/sessoes" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar às sessões
      </Link>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <ResumoSalvo id={id} />

        <aside className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">Levar o resumo no celular</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Escaneie o QR code com a câmera do celular.</p>

          <div className="mt-4 flex justify-center">
            <div
              style={{ width: 240, height: 240 }}
              className="flex items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-ink-soft)]"
              aria-label="Espaço do QR code"
            >
              <QrCode size={64} />
            </div>
          </div>

          <label className="mt-4 block text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="endereco-qr">
            Endereço do hub que o celular consegue acessar
          </label>
          <input
            id="endereco-qr"
            defaultValue="http://localhost:3000"
            spellCheck={false}
            className="mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
          />
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Em rede local, use o IP do computador (ex.: http://192.168.0.10:3000). Com localhost, só o próprio computador
            abre o link.
          </p>

          <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
            Confirme que a pessoa baixou o PDF no celular antes de liberar a tela para a próxima. O reset não afeta o PDF
            já baixado — só apaga as sessões carregadas neste computador.
          </p>
          <BotaoAcao rotulo="Próxima pessoa" Icone={RotateCcw} className="mt-3 w-full" />
        </aside>
      </div>
    </>
  )
}
