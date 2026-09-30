import { Clapperboard, Home, ListChecks, Settings, type LucideIcon } from 'lucide-react'
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
      { rota: '/sessoes', label: 'Sessões', Icone: ListChecks },
    ],
  },
]

// Fica no rodapé do menu, acima do nome da pessoa.
export const ITEM_CONFIGURACOES: ItemMenu = { rota: '/configuracoes', label: 'Configurações', Icone: Settings }

// Rotas de tela cheia, sem o menu: a partida (calibração e fases) usa o viewport inteiro para os
// alvos, a introdução é uma história em tela cheia, e o resultado é aberto no celular pelo QR code.
export const ROTAS_TELA_CHEIA = ['/partida', '/introducao', '/resultado']

// Rotas abertas sem login: o resultado é aberto no celular pelo QR code, e o token do link é a chave.
export const ROTAS_PUBLICAS = ['/resultado']

export function ehRotaPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`))
}

export function ehTelaCheia(caminho: string): boolean {
  return ROTAS_TELA_CHEIA.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`))
}

/** Item do menu ativo para o caminho atual ("/" só casa exatamente). */
export function itemAtivo(rota: string, caminho: string): boolean {
  return rota === '/' ? caminho === '/' : caminho === rota || caminho.startsWith(`${rota}/`)
}
