import { Clapperboard, Home, Settings, UserPlus, type LucideIcon } from 'lucide-react'
import { JOGOS } from './jogos'

export type ItemMenu = { rota: string; label: string; Icone: LucideIcon }
export type GrupoMenu = { titulo?: string; itens: ItemMenu[] }

// Itens do menu lateral.
export const GRUPOS_MENU: GrupoMenu[] = [
  {
    itens: [
      { rota: '/', label: 'Início', Icone: Home },
      { rota: '/introducao', label: 'Introdução', Icone: Clapperboard },
      // Um item por jogo do catálogo (lib/jogos.ts): jogo novo entra no menu sozinho.
      ...JOGOS.map(({ rota, nome, Icone }) => ({ rota, label: nome, Icone })),
    ],
  },
  {
    titulo: 'Experiência',
    itens: [
      { rota: '/cadastro', label: 'Criar conta', Icone: UserPlus },
    ],
  },
]

// Fica no rodapé do menu.
export const ITEM_CONFIGURACOES: ItemMenu = { rota: '/configuracoes', label: 'Configurações', Icone: Settings }

// Rotas de tela cheia, sem o menu: a partida (calibração e fases) usa o viewport inteiro para os
// alvos, e a introdução é uma história em tela cheia.
export const ROTAS_TELA_CHEIA = ['/partida', '/introducao']

export function ehTelaCheia(caminho: string): boolean {
  return ROTAS_TELA_CHEIA.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`))
}

/** Item do menu ativo para o caminho atual ("/" só casa exatamente). */
export function itemAtivo(rota: string, caminho: string): boolean {
  return rota === '/' ? caminho === '/' : caminho === rota || caminho.startsWith(`${rota}/`)
}
