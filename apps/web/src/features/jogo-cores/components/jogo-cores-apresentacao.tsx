'use client'

import { Palette, Volume2, Sparkles, Cpu, Play } from 'lucide-react'

interface Props {
  onIniciar: () => void
}

export default function JogoCoresApresentacao({ onIniciar }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Cabeçalho do Jogo */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Palette className="h-6 w-6" />
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Disponível
          </span>
        </div>

        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Jogo das Cores</h1>
          <p className="text-xs font-medium text-slate-400">Genius ESP32 (Hardware Serial)</p>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">
          Jogo de memória sequencial visual e auditiva com 5 cores e frequências sonoras distintas. 
          O ESP32 gera a sequência dinâmica e avalia as respostas recebidas em tempo real via porta USB.
        </p>
      </div>

      {/* Cartão de Hardware e Áudio */}
      <div className="flex items-start gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-emerald-950">Integração por Hardware (Web Serial API)</h2>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800">
            Comunicação direta a 115200 bps. A reprodução sonora usa Web Audio API localmente e as entradas físicas
            são sincronizadas através dos botões mapeados no circuito do ESP32.
          </p>
        </div>
      </div>

      {/* Como Jogar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Como funciona</h2>
        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              1
            </span>
            <p>Conecte o microcontrolador ESP32 na porta USB do computador através do navegador.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              2
            </span>
            <p>Observe a sequência de luzes e sons apresentada pelas 5 cores (Cinza, Amarelo, Verde, Vermelho e Azul).</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              3
            </span>
            <p>Quando for indicada a sua vez, pressione os botões físicos do ESP32 na exata ordem reproduzida.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              4
            </span>
            <p>A cada acerto, a sequência ganha uma cor a mais. O erro encerra a partida e grava seu recorde.</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onIniciar}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-white" />
            Jogar agora
          </button>
        </div>
      </div>
    </div>
  )
}