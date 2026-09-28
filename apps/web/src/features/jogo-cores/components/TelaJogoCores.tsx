'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, Cpu, Play, RefreshCw, Trophy, Usb, Volume2 } from 'lucide-react'
import { CORES_GENIUS, type EventoGenius } from '../cores.config'
import { useGeniusSerial } from '../hooks/useGeniusSerial'

interface Props {
  onVoltar?: () => void
}

export default function TelaJogoCores({ onVoltar }: Props) {
  const [rodada, setRodada] = useState<number>(0)
  const [recorde, setRecorde] = useState<number>(0)
  const [corAtivaId, setCorAtivaId] = useState<number | null>(null)
  const [statusTexto, setStatusTexto] = useState<string>('Ligue o ESP32 para começar')
  const [estadoJogo, setEstadoJogo] = useState<'espera' | 'memorizar' | 'jogar' | 'acerto' | 'erro'>('espera')

  const audioCtxRef = useRef<AudioContext | null>(null)

  const tocarTom = useCallback((frequencia: number, duracaoMs = 300) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(frequencia, ctx.currentTime)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      setTimeout(() => osc.stop(), duracaoMs)
    } catch {
      // Ignora restrições de inicialização do áudio no browser
    }
  }, [])

  const acenderCor = useCallback(
    (indiceCor: number, duracaoMs = 380) => {
      setCorAtivaId(indiceCor)
      const corObj = CORES_GENIUS.find((c) => c.id === indiceCor)
      if (corObj) {
        tocarTom(corObj.frequencia, duracaoMs)
      }
      setTimeout(() => {
        setCorAtivaId((atual) => (atual === indiceCor ? null : atual))
      }, duracaoMs)
    },
    [tocarTom]
  )

  const processarEvento = useCallback(
    (evento: EventoGenius) => {
      switch (evento.evento) {
        case 'pronto_para_iniciar':
          setStatusTexto("ESP32 pronto! Clique em 'Iniciar Partida'.")
          setEstadoJogo('espera')
          break

        case 'inicio_rodada':
          setEstadoJogo('memorizar')
          setRodada(evento.rodada ?? 1)
          setStatusTexto('Memorize a sequência que o ESP32 vai reproduzir...')
          break

        case 'tocar_cor':
          if (evento.cor !== undefined) {
            acenderCor(evento.cor, 380)
          }
          break

        case 'sua_vez':
          setEstadoJogo('jogar')
          setStatusTexto(`A sua vez! Pressione os ${evento.total ?? ''} botões no ESP32.`)
          break

        case 'botao_pressionado':
          if (evento.cor !== undefined) {
            acenderCor(evento.cor, 200)
          }
          break

        case 'acertou_rodada':
          setEstadoJogo('acerto')
          setStatusTexto('Sequência correta! Avançando de fase...')
          if (evento.pontuacao && evento.pontuacao > recorde) {
            setRecorde(evento.pontuacao)
          }
          break

        case 'game_over':
          setEstadoJogo('erro')
          tocarTom(120, 600)
          setStatusTexto(`Fim de jogo! Pontuação final: ${evento.pontuacao_final ?? 0}`)
          break
      }
    },
    [acenderCor, recorde, tocarTom]
  )

  const { conectado, erro, conectar, enviarComando } = useGeniusSerial(processarEvento)

  const handleIniciarJogo = () => {
    enviarComando('START')
    setStatusTexto('A iniciar nova sequência...')
  }

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-200 ${
        estadoJogo === 'acerto'
          ? 'bg-emerald-50'
          : estadoJogo === 'erro'
            ? 'bg-rose-50'
            : 'bg-slate-50/50'
      }`}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        {/* Botão Voltar */}
        {onVoltar && (
          <div>
            <button
              type="button"
              onClick={onVoltar}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao menu
            </button>
          </div>
        )}

        {/* Card do Hardware ESP32 */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Genius ESP32 (5 Cores)</h2>
              <p className="text-xs text-slate-400">Comunicação Serial a 115200 bps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ${
                conectado
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${conectado ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {conectado ? 'Conectado' : 'Desconectado'}
            </span>

            {!conectado ? (
              <button
                type="button"
                onClick={conectar}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
              >
                <Usb className="h-4 w-4" />
                Ligar à Porta USB
              </button>
            ) : (
              <button
                type="button"
                onClick={handleIniciarJogo}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-white" />
                {rodada > 0 ? 'Reiniciar Jogo' : 'Iniciar Partida'}
              </button>
            )}
          </div>
        </div>

        {erro && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
            {erro}
          </div>
        )}

        {/* Tabuleiro com os 5 Blocos de Cores do Genius */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Volume2 className="h-4 w-4" />
            <span>{statusTexto}</span>
          </div>

          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-5">
            {CORES_GENIUS.map((cor) => {
              const estaAtivo = corAtivaId === cor.id
              return (
                <div
                  key={cor.id}
                  className={`flex h-36 flex-col items-center justify-end rounded-2xl border p-4 transition-all duration-100 select-none ${cor.borda} ${
                    estaAtivo ? cor.corAtiva : `${cor.corBg} opacity-60`
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">
                    {cor.nome}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Métricas e Placar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <span className="text-xs font-semibold text-slate-400">Fase Atual</span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {rodada}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400">Maior Sequência</span>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">
                {recorde}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Trophy className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}