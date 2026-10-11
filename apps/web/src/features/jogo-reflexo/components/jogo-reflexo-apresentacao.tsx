'use client'

import { ArrowLeft, ArrowRight, Gauge, Play, ShieldAlert, Cpu , Timer, Zap } from 'lucide-react'
import { STATUS_JOGO, jogoPorChave } from '@/lib/jogos'


interface Props {
    onComecar: () => void
    onVoltar?: () => void
}

export default function ApresentacaoReflexo({ onComecar, onVoltar }: Props) {
    const jogo = jogoPorChave('reflexo')
    const statusInfo = STATUS_JOGO[jogo.status]

    return (
        <div className="flex w-full flex-col gap-6">
            {/* Botão Superior */}
            <button
                type="button"
                onClick={onVoltar ?? (() => window.history.back())}
                className="flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 cursor-pointer"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao menu
            </button>

            {/* Cartão de Destaque / Painel Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-amber-50/30 p-8 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-xl space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                                <Zap className="h-5 w-5 fill-amber-500/20" />
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.classes}`}>
                                {statusInfo.label}
                            </span>
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {jogo.nome}
                        </h1>
                        <p className="text-sm font-medium text-slate-500">{jogo.tipo}</p>
                        <p className="text-sm leading-relaxed text-slate-600">
                            {jogo.descricao}
                        </p>
                    </div>

                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={onComecar}
                            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg cursor-pointer md:w-auto"
                        >
                            Começar Teste
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Guia Visual Rápido dos Estados */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Mecânica de Estímulo e Resposta
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                            <Timer className="h-4 w-4" />
                        </div>
                        <span className="mt-3 text-sm font-bold text-rose-950">1. Modo Espera</span>
                        <p className="mt-1 text-xs text-rose-800/80">
                            O ecrã permanece vermelho por um período aleatório (2 a 5s). Não clique ainda.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <Play className="h-4 w-4 fill-emerald-600" />
                        </div>
                        <span className="mt-3 text-sm font-bold text-emerald-950">2. Disparo Verde</span>
                        <p className="mt-1 text-xs text-emerald-800/80">
                            Assim que mudar para verde, clique o mais depressa possível para travar o temporizador.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <ShieldAlert className="h-4 w-4" />
                        </div>
                        <span className="mt-3 text-sm font-bold text-amber-950">3. Falsa Partida</span>
                        <p className="mt-1 text-xs text-amber-800/80">
                            Clicar antes do sinal verde anula a medição da tentativa imediatamente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Painel Analítico de Métricas */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <Gauge className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Métricas Registadas</h3>
                            <p className="text-xs text-slate-400">Avaliação do tempo de resposta</p>
                        </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Tempo de reação simples aferido em milissegundos (ms)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Registo de antecipações (queima de largada)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Classificação por escala psicomotora
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Hardware e Acionamento</h3>
                            <p className="text-xs text-slate-400">Instruções para o botão físico no ESP32</p>
                        </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Mantenha o dedo posicionado sobre o botão físico na caixa do circuito
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Aguarde o sinal verde na tela e pressione o botão
                        </li>
                        
                    </ul>
                </div>
            </div>
        </div>
    )
}