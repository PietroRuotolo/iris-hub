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
    detalhes: {
      secoes: [
        { titulo: 'Em construção', pendente: 'A página deste software será preenchida em breve.' },
      ],
    },
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
    detalhes: {
      secoes: [
        { titulo: 'Em construção', pendente: 'A página deste software será preenchida em breve.' },
      ],
    },
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
    detalhes: {
      aviso: 'O back-end não tem tela própria: ele funciona nos bastidores, consumido por outros softwares através da API.',
      secoes: [
        {
          titulo: 'O que é',
          texto: 'API em Java com Spring Boot que centraliza os dados do ecossistema iris, como as sessões geradas pelos testes do neuro-demo e do jogo de ritmo.',
        },
        {
          titulo: 'Papel no ecossistema',
          itens: [
            'Recebe os dados de sessão dos testes (por exemplo, acertos, erros e tempo de resposta).',
            'Disponibiliza esses dados para os apps web do ecossistema.',
            'Mantém um único modelo de dados para pacientes e sessões.',
          ],
        },
        {
          titulo: 'Stack',
          itens: ['Java', 'Spring Boot'],
        },
        {
          titulo: 'Status da API',
          pendente: 'Um painel de status (health check) só será criado se o back-end precisar de uma tela própria. Decisão em aberto.',
        },
        {
          titulo: 'Repositório',
          pendente: 'O link será adicionado quando o projeto for publicado.',
        },
      ],
    },
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
