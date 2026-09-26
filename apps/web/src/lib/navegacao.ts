import { Eye, Home, ListChecks, type LucideIcon } from 'lucide-react'

export type ItemMenu = { rota: string; label: string; Icone: LucideIcon }
export type GrupoMenu = { titulo?: string; itens: ItemMenu[] }

// Itens do menu lateral.
export const GRUPOS_MENU: GrupoMenu[] = [
  {
    itens: [
      { rota: '/', label: 'Início', Icone: Home },
      { rota: '/jogo', label: 'Jogo de ritmo', Icone: Eye },
    ],
  },
  {
    titulo: 'Experiência',
    itens: [
      { rota: '/sessoes', label: 'Sessões', Icone: ListChecks },
    ],
  },
]

// Rotas de tela cheia, sem o menu: a calibração usa o viewport inteiro para os alvos, e o
// resultado é aberto no celular pelo QR code.
export const ROTAS_TELA_CHEIA = ['/calibracao', '/resultado']

export function ehTelaCheia(caminho: string): boolean {
  return ROTAS_TELA_CHEIA.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`))
}

/** Item do menu ativo para o caminho atual ("/" só casa exatamente). */
export function itemAtivo(rota: string, caminho: string): boolean {
  return rota === '/' ? caminho === '/' : caminho === rota || caminho.startsWith(`${rota}/`)
}
