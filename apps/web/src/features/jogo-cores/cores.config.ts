export interface CorGenius {
  id: number
  nome: string
  frequencia: number
  corBg: string
  corAtiva: string
  borda: string
  texto: string
}

export const CORES_GENIUS: CorGenius[] = [
  {
    id: 0,
    nome: 'Cinza',
    frequencia: 261.63,
    corBg: 'bg-slate-200 text-slate-700',
    corAtiva: 'bg-slate-400 ring-4 ring-slate-300 scale-105 shadow-lg',
    borda: 'border-slate-300',
    texto: 'text-slate-800',
  },
  {
    id: 1,
    nome: 'Amarelo',
    frequencia: 329.63,
    corBg: 'bg-amber-100 text-amber-800',
    corAtiva: 'bg-amber-400 ring-4 ring-amber-300 scale-105 shadow-amber-200 shadow-lg',
    borda: 'border-amber-300',
    texto: 'text-amber-900',
  },
  {
    id: 2,
    nome: 'Verde',
    frequencia: 392.0,
    corBg: 'bg-emerald-100 text-emerald-800',
    corAtiva: 'bg-emerald-400 ring-4 ring-emerald-300 scale-105 shadow-emerald-200 shadow-lg',
    borda: 'border-emerald-300',
    texto: 'text-emerald-900',
  },
  {
    id: 3,
    nome: 'Vermelho',
    frequencia: 523.25,
    corBg: 'bg-rose-100 text-rose-800',
    corAtiva: 'bg-rose-500 ring-4 ring-rose-300 text-white scale-105 shadow-rose-200 shadow-lg',
    borda: 'border-rose-300',
    texto: 'text-rose-900',
  },
  {
    id: 4,
    nome: 'Azul',
    frequencia: 659.25,
    corBg: 'bg-blue-100 text-blue-800',
    corAtiva: 'bg-blue-500 ring-4 ring-blue-300 text-white scale-105 shadow-blue-200 shadow-lg',
    borda: 'border-blue-300',
    texto: 'text-blue-900',
  },
]

export type TipoEventoGenius =
  | 'pronto_para_iniciar'
  | 'inicio_rodada'
  | 'tocar_cor'
  | 'sua_vez'
  | 'botao_pressionado'
  | 'acertou_rodada'
  | 'game_over'

export interface EventoGenius {
  evento: TipoEventoGenius
  rodada?: number
  cor?: number
  total?: number
  pontuacao?: number
  pontuacao_final?: number
}