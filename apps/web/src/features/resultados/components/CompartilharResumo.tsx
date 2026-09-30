'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ExternalLink, LoaderCircle, QrCode, RotateCcw } from 'lucide-react'
import QRCode from 'qrcode'
import BotaoAcao from '@/components/BotaoAcao'
import { useAuth } from '@/components/auth/AuthGate'
import { gerarResumoCompartilhado, linkDoResumo } from '@/lib/api/resumos'

type Estado =
  | { tipo: 'ocioso' }
  | { tipo: 'gerando' }
  | { tipo: 'pronto'; token: string; expiraEm: string; qr: string }
  | { tipo: 'erro'; mensagem: string }

/**
 * Gera o QR code do resumo da pessoa logada (a última partida encerrada de cada jogo, guardada no
 * banco) e encerra a vez dela ("Próxima pessoa" sai da conta e libera o computador).
 */
export default function CompartilharResumo() {
  const { sair } = useAuth()
  // O endereço que o celular alcança: por padrão, o do próprio site (troque pelo IP da rede local em dev).
  // Só roda no navegador (fica atrás do login), então window existe.
  const [base, setBase] = useState(() => (typeof window === 'undefined' ? '' : window.location.origin))
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' })

  const link = estado.tipo === 'pronto' ? linkDoResumo(base, estado.token) : null

  // O endereço pode mudar depois de gerado: o QR acompanha, sem criar outro link no banco.
  useEffect(() => {
    if (estado.tipo !== 'pronto' || !link) return
    let ativo = true
    QRCode.toDataURL(link, { width: 480, margin: 1 }).then((qr) => ativo && setEstado((e) => (e.tipo === 'pronto' ? { ...e, qr } : e)))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link])

  async function gerar() {
    setEstado({ tipo: 'gerando' })
    try {
      const { token, expiraEm } = await gerarResumoCompartilhado()
      const qr = await QRCode.toDataURL(linkDoResumo(base, token), { width: 480, margin: 1 })
      setEstado({ tipo: 'pronto', token, expiraEm, qr })
    } catch (erro) {
      setEstado({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : String(erro) })
    }
  }

  return (
    <aside className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">Levar o resumo no celular</h2>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        O resumo junta a última partida encerrada de cada jogo. Gere o QR code e escaneie com a câmera do celular.
      </p>

      <div className="mt-4 flex justify-center">
        {estado.tipo === 'pronto' ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem gerada na hora (data URL)
          <img src={estado.qr} alt="QR code do resumo" width={240} height={240} className="rounded-xl" />
        ) : (
          <div
            style={{ width: 240, height: 240 }}
            className="flex items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-ink-soft)]"
          >
            {estado.tipo === 'gerando' ? <LoaderCircle size={40} className="animate-spin" /> : <QrCode size={64} />}
          </div>
        )}
      </div>

      {estado.tipo === 'erro' && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--color-warn-bg)] p-3 text-sm text-[var(--color-ink)]" role="alert">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-warn)]" /> {estado.mensagem}
        </p>
      )}

      <button
        type="button"
        onClick={gerar}
        disabled={estado.tipo === 'gerando' || !base}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-4 py-3 text-sm font-semibold text-[var(--color-surface)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <QrCode size={18} /> {estado.tipo === 'pronto' ? 'Gerar de novo (com as partidas mais recentes)' : 'Gerar QR code'}
      </button>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-[var(--color-navy)] underline"
        >
          Abrir o resumo aqui <ExternalLink size={14} />
        </a>
      )}

      <label className="mt-4 block text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="endereco-qr">
        Endereço do hub que o celular consegue acessar
      </label>
      <input
        id="endereco-qr"
        value={base}
        onChange={(e) => setBase(e.target.value.trim())}
        spellCheck={false}
        className="mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
      />
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
        Na Vercel, deixe como está. Rodando local, troque pelo IP do computador na rede (ex.: http://192.168.0.10:3000),
        senão o celular não abre o link.
      </p>

      <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
        Confirme que a pessoa baixou o PDF no celular antes de liberar a tela. &quot;Próxima pessoa&quot; sai desta conta; o
        link do resumo continua valendo por 7 dias.
      </p>
      <BotaoAcao rotulo="Próxima pessoa" Icone={RotateCcw} aoConfirmar={() => void sair()} className="mt-3 w-full" />
    </aside>
  )
}
