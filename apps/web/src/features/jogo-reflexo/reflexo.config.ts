import { Zap, type LucideIcon } from 'lucide-react'

export type StatusJogo = 'disponivel' | 'desenvolvimento'

export interface SecaoApresentacao {
  titulo: string
  texto?: string
  itens?: string[]
  ordenada?: boolean
  pendente?: string
  midia?: { src: string | null; pendente: string }
  link?: { href: string; label: string }
}

export interface Jogo {
  id: string
  rota: string
  nome: string
  tipo: string
  descricao: string
  status: StatusJogo
  Icone: LucideIcon
  apresentacao: { aviso?: string; secoes: SecaoApresentacao[] }
}

export const STATUS_JOGO: Record<StatusJogo, { label: string; classes: string }> = {
  disponivel: {
    label: 'Disponível',
    classes: 'bg-[var(--color-good-bg)] text-[var(--color-good)]',
  },
  desenvolvimento: {
    label: 'Em desenvolvimento',
    classes: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  },
}

export const JOGO_REFLEXO: Jogo = {
  id: 'jogo-reflexo',
  rota: '/jogo-reflexo',
  nome: 'Jogo de reflexo',
  tipo: 'Aplicação web (teste de reação)',
  descricao: 'Avaliação de tempo de reação motora simples a estímulos visuais na tela.',
  status: 'disponivel',
  Icone: Zap,
  apresentacao: {
    aviso:
      'Roda direto no navegador. O objetivo é clicar na tela o mais rápido possível assim que a área mudar para verde.',
    secoes: [
      {
        titulo: 'O que é',
        texto:
          'Um teste psicomotor clássico de tempo de reação motora. Você aguarda o sinal de preparação e clica no alvo imediatamente após a mudança de cor, sem queimar a largada.',
      },
      {
        titulo: 'Jogar',
        texto:
          'A partida começa no modo de espera: aguarde a área ficar verde e clique o mais rápido que conseguir. Clicar antes da hora registra falta.',
        link: { href: '#', label: 'Começar partida' },
      },
      {
        titulo: 'Como funciona',
        ordenada: true,
        itens: [
          'Preparação: o sistema entra em espera por um tempo aleatório entre 2 e 5 segundos.',
          'Estímulo: a tela fica verde e aparece a palavra "Clique!".',
          'Acionamento: o tempo até o seu clique é calculado em milissegundos (ms).',
          'Falta: se você clicar enquanto estiver em "Espere...", o teste acusa "Cedo demais".',
        ],
      },
      {
        titulo: 'Dados registrados',
        itens: [
          'Tempo de resposta em milissegundos (ms)',
          'Tentativas antecipadas (queimas de largada)',
          'Classificação do tempo de reação (Excelente, Bom, Regular ou Lento)',
        ],
      },
    ],
  },
}