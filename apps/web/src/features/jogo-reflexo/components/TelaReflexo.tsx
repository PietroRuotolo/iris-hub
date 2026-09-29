'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, Cpu, Usb } from 'lucide-react'
import PainelSalvamento, { type EstadoGravacao } from '@/components/PainelSalvamento'
import { ErroAoEncerrar } from '@/lib/api/http'
import { registrarSessaoReflexo } from '@/lib/api/reflexo'
import { COLETA_REFLEXO_VAZIA, aplicarEventoReflexo, type ColetaReflexo } from '../coletor'
import { useEsp32Serial, type EventoEsp32 } from '../hooks/useEsp32Serial'

//vou mudar o layout ainda, ta muito feio, ta assim para ser testado
interface Props {
  onVoltar?: () => void
}

export default function TelaReflexo({ onVoltar }: Props) {
  const [status, setStatus] = useState<EventoEsp32['status'] | 'desconectado'>('desconectado')
  const [valorDisplay, setValorDisplay] = useState<string | number>('Aguardando conexão')
  const [tempoMs, setTempoMs] = useState<number | null>(null)
  const [tentativas, setTentativas] = useState<number[]>([])
  // O que vai para o banco (inclui as largadas queimadas, que a lista de tempos abaixo não mostra).
  const coleta = useRef<ColetaReflexo>(COLETA_REFLEXO_VAZIA)
  const [totalColetado, setTotalColetado] = useState(0)
  const [gravacao, setGravacao] = useState<EstadoGravacao>({ tipo: 'ocioso' })
  // Se criou a sessão mas falhou ao encerrar, a nova tentativa reaproveita a mesma (sem criar outra).
  const sessaoPendente = useRef<string | null>(null)

  const lidarComEventoSerial = useCallback((evento: EventoEsp32) => {
    coleta.current = aplicarEventoReflexo(coleta.current, evento, performance.now())
    setTotalColetado(coleta.current.tentativas.length)
    setStatus(evento.status)

    if (evento.status === 'contagem') {
      setValorDisplay(evento.valor ?? '...')
    } else if (evento.status === 'esperando') {
      setValorDisplay('...')
      setTempoMs(null)
    } else if (evento.status === 'reagir') {
      setValorDisplay('REAGIR AGORA!')
    } else if (evento.status === 'queimou') {
      setValorDisplay('FALHA')
    } else if (evento.status === 'sucesso') {
      const ms = typeof evento.valor === 'number' ? evento.valor : Number(evento.valor)
      setTempoMs(ms)
      setValorDisplay(`${ms} ms`)
      if (!Number.isNaN(ms)) {
        setTentativas((prev) => [ms, ...prev])
      }
    }
  }, [])

  const { conectado, erro, conectar } = useEsp32Serial(lidarComEventoSerial)

  async function salvarSessao() {
    const enviadas = coleta.current.tentativas
    if (enviadas.length === 0) return
    setGravacao({ tipo: 'salvando' })
    try {
      const { sessao } = await registrarSessaoReflexo('CONCLUIDA', enviadas, sessaoPendente.current)
      sessaoPendente.current = null
      // Nova sessão: começa do zero, para a próxima partida não repetir estas rodadas.
      coleta.current = COLETA_REFLEXO_VAZIA
      setTotalColetado(0)
      setTentativas([])
      setTempoMs(null)
      setGravacao({ tipo: 'salvo', id: sessao.id })
    } catch (erro) {
      if (erro instanceof ErroAoEncerrar) sessaoPendente.current = erro.idSessao
      setGravacao({ tipo: 'erro', mensagem: erro instanceof Error ? erro.message : String(erro) })
    }
  }

  const media =
    tentativas.length > 0
      ? Math.round(tentativas.reduce((acc, curr) => acc + curr, 0) / tentativas.length)
      : null

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Botão de retorno ao menu */}
      {onVoltar && (
        <button
          type="button"
          onClick={onVoltar}
          className="flex w-fit items-center gap-2 text-sm font-medium text-[var(--color-ink-soft,#64748b)] transition hover:text-[var(--color-navy,#0f172a)] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à apresentação
        </button>
      )}

      {/* Cartão de Estado da Conexão USB / Hardware */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[var(--color-navy,#0f172a)]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-navy,#0f172a)]">
              Dispositivo ESP32
            </h2>
            <p className="text-xs text-[var(--color-ink-soft,#64748b)]">
              Comunicação Serial a 115200 bps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              conectado
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${conectado ? 'bg-emerald-500' : 'bg-slate-400'}`}
            />
            {conectado ? 'Conectado' : 'Desconectado'}
          </span>

          {!conectado && (
            <button
              type="button"
              onClick={conectar}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-navy,#0f2a4a)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-navy-dark,#0a1c31)] cursor-pointer"
            >
              <Usb className="h-4 w-4" />
              Ligar à Porta USB
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          {erro}
        </div>
      )}

      {/* Caixa Interativa de Estímulo Visual (Reage aos eventos do ESP32) */}
      <div
        className={`flex h-80 w-full flex-col items-center justify-center rounded-3xl p-6 text-center shadow-sm transition-all duration-75 select-none ${
          !conectado
            ? 'border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400'
            : status === 'reagir'
              ? 'bg-[#00e676] text-slate-900 shadow-2xl scale-[1.01]'
              : status === 'esperando'
                ? 'bg-amber-500 text-white'
                : status === 'contagem'
                  ? 'bg-slate-800 text-amber-300'
                  : status === 'queimou'
                    ? 'bg-rose-600 text-white'
                    : 'border border-[var(--color-border,#e2e8f0)] bg-white text-[var(--color-navy,#0f172a)]'
        }`}
      >
        {!conectado ? (
          <div className="flex flex-col items-center gap-2">
            <Usb className="h-10 w-10 stroke-[1.5]" />
            <span className="text-base font-semibold">Ligue o ESP32 via USB para começar</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest opacity-80">
              {status === 'esperando' && 'Atenção, fique pronto...'}
              {status === 'contagem' && 'Contagem regressiva'}
              {status === 'reagir' && 'Aperte o botão do ESP32!'}
              {status === 'queimou' && 'Queimou a largada!'}
              {status === 'sucesso' && 'Tempo registrado'}
              {(status === 'desconectado' || !status) && 'Pronto para iniciar'}
            </span>

            <span
              className={`text-6xl font-black tracking-tight ${
                status === 'reagir' ? 'text-black' : ''
              }`}
            >
              {valorDisplay}
            </span>

            {status === 'sucesso' && tempoMs !== null && (
              <span className="mt-2 text-xs font-medium text-slate-500">
                Pressione o botão físico do ESP32 para nova rodada
              </span>
            )}
          </div>
        )}
      </div>

      {/* Histórico e Estatísticas no padrão Iris Hub */}
      {conectado && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-[var(--color-ink-soft,#64748b)]">
              Último Registro
            </span>
            <div className="mt-2 text-2xl font-bold text-[var(--color-navy,#0f172a)]">
              {tempoMs !== null ? `${tempoMs} ms` : '—'}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-[var(--color-ink-soft,#64748b)]">
              Média Geral
            </span>
            <div className="mt-2 text-2xl font-bold text-[var(--color-navy,#0f172a)]">
              {media !== null ? `${media} ms` : '—'}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-[var(--color-ink-soft,#64748b)]">
              Tentativas
            </span>
            <div className="mt-2 text-2xl font-bold text-[var(--color-navy,#0f172a)]">
              {tentativas.length}
            </div>
          </div>
        </div>
      )}

      <PainelSalvamento
        estado={gravacao}
        jogo="reflexo"
        rotuloSalvar="Encerrar e salvar sessão"
        podeSalvar={totalColetado > 0}
        aoSalvar={salvarSessao}
      />

      {tentativas.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border,#e2e8f0)] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--color-navy,#0f172a)]">
            Histórico da Sessão
          </h3>
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {tentativas.map((valor, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between py-2 text-[var(--color-ink,#334155)]"
              >
                <span>Tentativa #{tentativas.length - idx}</span>
                <span className="font-semibold text-[var(--color-navy,#0f172a)]">{valor} ms</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}