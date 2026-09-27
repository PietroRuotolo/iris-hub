import { Clapperboard, Eye, Home, ListChecks, Settings, Zap, type LucideIcon } from 'lucide-react'

export type ItemMenu = { rota: string; label: string; Icone: LucideIcon }
export type GrupoMenu = { titulo?: string; itens: ItemMenu[] }

// Itens do menu lateral.
export const GRUPOS_MENU: GrupoMenu[] = [
  {
    itens: [
      { rota: '/', label: 'Início', Icone: Home },
      { rota: '/introducao', label: 'Introdução', Icone: Clapperboard },
      { rota: '/jogo', label: 'Jogo de ritmo', Icone: Eye },
      { rota: '/jogo-reflexo', label: 'Jogo do reflexo', Icone: Zap },
    ],
  },
  {
    titulo: 'Experiência',
    itens: [
      { rota: '/sessoes', label: 'Sessões', Icone: ListChecks },
    ],
  },
]

// Fica no rodapé do menu, acima do nome da pessoa.
export const ITEM_CONFIGURACOES: ItemMenu = { rota: '/configuracoes', label: 'Configurações', Icone: Settings }

// Rotas de tela cheia, sem o menu: a partida (calibração e fases) usa o viewport inteiro para os
// alvos, a introdução é uma história em tela cheia, e o resultado é aberto no celular pelo QR code.
export const ROTAS_TELA_CHEIA = ['/partida', '/introducao', '/resultado']

export function ehTelaCheia(caminho: string): boolean {
  return ROTAS_TELA_CHEIA.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`))
}

/** Item do menu ativo para o caminho atual ("/" só casa exatamente). */
export function itemAtivo(rota: string, caminho: string): boolean {
  return rota === '/' ? caminho === '/' : caminho === rota || caminho.startsWith(`${rota}/`)
}
