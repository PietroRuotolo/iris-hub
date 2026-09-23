import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import useSessoes from '../hooks/useSessoes'
import BotaoConfirmar from '../components/BotaoConfirmar'
import LaudoDocumento from '../components/LaudoDocumento'
import QrCode from '../components/QrCode'
import { agregar, agruparPorJogo, codificarResumo } from '../services/laudo'
import { limparSessoes } from '../services/sessoes'

const CHAVE_BASE = 'iris-hub:endereco-qr'

function enderecoInicial() {
  try {
    return localStorage.getItem(CHAVE_BASE) || window.location.origin
  } catch {
    return window.location.origin
  }
}

export default function Laudo() {
  const sessoes = useSessoes()
  const navigate = useNavigate()
  const [dataIso] = useState(() => new Date().toISOString())
  const [endereco, setEndereco] = useState(enderecoInicial)
  const grupos = useMemo(
    () => agruparPorJogo(sessoes).map(({ jogo, sessoes }) => ({ jogo, resumo: agregar(sessoes) })),
    [sessoes],
  )

  function alterarEndereco(valor) {
    setEndereco(valor)
    try {
      localStorage.setItem(CHAVE_BASE, valor)
    } catch {
      // só não lembra do endereço na próxima vez
    }
  }

  function proximaPessoa() {
    limparSessoes()
    navigate('/sessoes')
  }

  if (sessoes.length === 0) {
    return (
      <>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Laudo</h1>
        <p className="mt-3 rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-ink-soft)] shadow-sm">
          Ainda não há sessões para gerar o laudo.{' '}
          <Link to="/sessoes" className="font-medium text-[var(--color-navy)]">
            Carregar sessões
          </Link>
        </p>
      </>
    )
  }

  const base = endereco.trim().replace(/\/+$/, '')
  const link = `${base}/resultado#d=${codificarResumo(grupos, dataIso)}`

  return (
    <>
      <Link to="/sessoes" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-navy)]">
        <ArrowLeft size={16} /> Voltar às sessões
      </Link>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <LaudoDocumento grupos={grupos} dataIso={dataIso} />

        <aside className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-[var(--color-navy)]">Levar o laudo no celular</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Escaneie o QR code com a câmera do celular.</p>

          <div className="mt-4 flex justify-center">
            <QrCode valor={link} />
          </div>

          <label className="mt-4 block text-xs font-medium text-[var(--color-ink-soft)]" htmlFor="endereco-qr">
            Endereço do hub que o celular consegue acessar
          </label>
          <input
            id="endereco-qr"
            value={endereco}
            onChange={(e) => alterarEndereco(e.target.value)}
            spellCheck={false}
            className="mt-1 w-full rounded-xl bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
          />
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            Em rede local, use o IP do computador (ex.: http://192.168.0.10:5173). Com localhost, só o próprio computador abre o link.
          </p>

          <BotaoConfirmar
            rotulo="Próxima pessoa"
            rotuloConfirmar="Toque de novo: apagar resultados"
            aoConfirmar={proximaPessoa}
            Icone={RotateCcw}
            className="mt-5 w-full"
          />
        </aside>
      </div>
    </>
  )
}
