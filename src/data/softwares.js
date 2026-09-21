import { Activity, Hand, Eye, Server } from 'lucide-react'

// Fonte única dos softwares do ecossistema: alimenta o menu, os cards e as rotas.
// Nomes finais de neuro-demo, jogo de ritmo e back-end ainda serão definidos.
export const SOFTWARES = [
  {
    id: 'iris',
    rota: '/iris',
    nome: 'iris',
    tipo: 'Aplicação web',
    descricao: 'Dashboard de acompanhamento médico: lista de pacientes, evolução das métricas e anotações clínicas.',
    status: 'disponivel',
    Icone: Activity,
  },
  {
    id: 'neuro-demo',
    rota: '/neuro-demo',
    nome: 'neuro-demo',
    tipo: 'App desktop (Python)',
    descricao: 'Protótipo de teste de tamborilar dedos, com detecção das mãos pela webcam.',
    status: 'desenvolvimento',
    Icone: Hand,
  },
  {
    id: 'jogo-ritmo',
    rota: '/jogo-ritmo',
    nome: 'Jogo de ritmo',
    tipo: 'App desktop (Python)',
    descricao: 'Jogo de ritmo controlado pelo olhar, que gera dados de acompanhamento para triagem neurológica.',
    status: 'desenvolvimento',
    Icone: Eye,
  },
  {
    id: 'backend',
    rota: '/backend',
    nome: 'Back-end',
    tipo: 'API (Java / Spring Boot)',
    descricao: 'API consumida pelos apps web e pelos dados de sessão dos testes.',
    status: 'desenvolvimento',
    Icone: Server,
  },
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
