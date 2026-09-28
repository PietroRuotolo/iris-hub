'use client'

import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Cpu,
  Gauge,
  Music2,
  Palette,
  Sparkles,
  Usb,
  Volume2,
} from 'lucide-react'
import { CORES_GENIUS } from '../cores.config'

interface Props {
  onIniciar: () => void
  onVoltar?: () => void
}

export default function JogoCoresApresentacao({ onIniciar, onVoltar }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Botão Superior */}
      <button
        type="button"
        onClick={onVoltar ?? (() => window.history.back())}
        className="flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao menu
      </button>

      {/* Cartão de Destaque / Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <Palette className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Disponível
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Jogo das Cores
            </h1>
            <p className="text-sm font-medium text-slate-400">
              Genius Sequencial ESP32 · Web Serial API
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Teste de memória operacional e retenção sensorial através de estímulos visuais e auditivos. 
              O circuito sorteia padrões progressivos e monitora a exatidão das respostas em tempo real.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onIniciar}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg cursor-pointer md:w-auto"
            >
              Iniciar Partida
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mapeamento das 5 Cores e Frequências Sonoras */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Espectro Visual e Frequências (Web Audio API)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Cada botão físico do circuito aciona um tom sonoro em onda triangular dedicado.
            </p>
          </div>
          <Music2 className="h-5 w-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CORES_GENIUS.map((cor) => (
            <div
              key={cor.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${cor.borda} ${cor.corBg} bg-opacity-70`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                  Botão {cor.id}
                </span>
                <span className="h-2 w-2 rounded-full bg-current opacity-80" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-bold block">{cor.nome}</span>
                <span className="text-[11px] font-medium opacity-75">
                  {cor.frequencia} Hz
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guia em Etapas da Dinâmica */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Mecânica de Jogo em 4 Etapas
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-200 text-xs font-black text-slate-800">
              1
            </span>
            <div className="mt-3">
              <h3 className="text-sm font-bold text-slate-900">Conexão USB</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Selecione a porta serial do microcontrolador conectada a 115200 bps.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-200 text-xs font-black text-slate-800">
              2
            </span>
            <div className="mt-3">
              <h3 className="text-sm font-bold text-slate-900">Percepção</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Memorize a sequência emitida simultaneamente na tela e no áudio.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-200 text-xs font-black text-slate-800">
              3
            </span>
            <div className="mt-3">
              <h3 className="text-sm font-bold text-slate-900">Execução</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Pressione os botões no ESP32 na ordem correta dentro do turno.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-200 text-xs font-black text-slate-800">
              4
            </span>
            <div className="mt-3">
              <h3 className="text-sm font-bold text-slate-900">Progressão</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Cada rodada ganha mais complexidade até a quebra da sequência.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Requisitos Técnicos e Dados */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Comunicação e Hardware</h3>
              <p className="text-xs text-slate-400">Integração física direta</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Taxa de transmissão fixada em 115200 bps
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Contratos de eventos estruturados em payloads JSON
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Buffer local para descarte automático de fragmentos de linha
            </li>
          </ul>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Domínios Avaliados</h3>
              <p className="text-xs text-slate-400">Capacidade cognitiva</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Amplitude e retenção de memória de curto prazo
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Associação visuo-espacial com retorno auditivo
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Inibição de impulsividade e controle de tempo de resposta
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}