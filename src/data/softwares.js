import { Hand, Eye, Server } from 'lucide-react'

// Fonte única dos softwares do hub: alimenta o menu, os cards e as rotas.
// O iris (front-end web) NÃO faz parte do hub: é apenas a referência visual.
// Nomes finais de neuro-demo, jogo de ritmo e back-end ainda serão definidos.
export const SOFTWARES = [
  {
    id: 'neuro-demo',
    rota: '/neuro-demo',
    nome: 'neuro-demo',
    tipo: 'App desktop (Python)',
    categoria: 'desktop',
    descricao: 'Protótipo de teste de tamborilar dedos, com detecção das mãos pela webcam.',
    status: 'desenvolvimento',
    Icone: Hand,
  },
  {
    id: 'jogo-ritmo',
    rota: '/jogo-ritmo',
    nome: 'Jogo de ritmo',
    tipo: 'App desktop (Python)',
    categoria: 'desktop',
    descricao: 'Jogo de ritmo controlado pelo olhar, que gera dados de acompanhamento para triagem neurológica.',
    status: 'desenvolvimento',
    Icone: Eye,
  },
  {
    id: 'backend',
    rota: '/backend',
    nome: 'Back-end',
    tipo: 'API (Java / Spring Boot)',
    categoria: 'api',
    descricao: 'API que recebe e serve os dados de sessão dos testes para os demais softwares.',
    status: 'desenvolvimento',
    Icone: Server,
  },
]

export const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'desktop', label: 'Apps desktop' },
  { id: 'api', label: 'API' },
]

export const STATUS = {
  disponivel: {
    label: 'Disponível',
    classes: 'bg-[var(--color-good-bg)] text-[var(--color-good)]',
  },
  desenvolvimento: {
    label: 'Em desenvolvimento',
    classes: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  },
}
