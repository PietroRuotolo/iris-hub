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
      aviso: 'Este app roda localmente no seu computador, usando a webcam. Ele não funciona dentro do navegador: aqui você encontra a descrição, os requisitos e a demonstração.',
      secoes: [
        {
          titulo: 'O que é',
          texto: 'Protótipo de teste de tamborilar dedos (finger tapping). A webcam captura as mãos e o software acompanha o movimento dos dedos durante o teste.',
        },
        {
          titulo: 'Como funciona',
          ordenada: true,
          itens: [
            'O app abre a webcam e detecta as mãos em tempo real.',
            'A pessoa executa o movimento de tamborilar os dedos diante da câmera.',
            'O software acompanha o movimento durante todo o teste.',
          ],
        },
        {
          titulo: 'Requisitos',
          itens: [
            'Computador com webcam',
            'Boa iluminação e mãos visíveis para a câmera',
            'Python',
            'OpenCV e MediaPipe',
          ],
        },
        {
          titulo: 'Como rodar',
          pendente: 'As instruções de execução serão publicadas quando o app tiver uma versão distribuível.',
        },
        {
          titulo: 'Download',
          pendente: 'O link de download será adicionado junto com a primeira versão.',
        },
        {
          titulo: 'Demonstração',
          midia: { src: null, pendente: 'Vídeo de demonstração em breve' },
        },
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
      aviso: 'Este app roda localmente no seu computador, usando a webcam. Ele não funciona dentro do navegador: aqui você encontra a descrição, os requisitos e a demonstração.',
      secoes: [
        {
          titulo: 'O que é',
          texto: 'Jogo de ritmo inspirado no osu!, em que o cursor é substituído pelo olhar. Alvos aparecem na tela e a pessoa deve olhar para eles dentro de uma janela de tempo, sem clicar em nada. O objetivo é gerar dados de acompanhamento que apoiem a triagem de doenças neurodegenerativas.',
        },
        {
          titulo: 'Como funciona',
          ordenada: true,
          itens: [
            'Calibração: a pessoa olha para pontos fixos na tela para ajustar o rastreamento.',
            'Os alvos aparecem em posições e momentos definidos.',
            'Se o olhar permanece sobre o alvo por tempo suficiente dentro da janela, conta como acerto; caso contrário, erro.',
            'Ao final da sessão, uma tela de resumo mostra os resultados.',
          ],
        },
        {
          titulo: 'Dados registrados',
          itens: [
            'Acertos e erros',
            'Tempo de resposta até o olhar chegar ao alvo',
            'Precisão do olhar em relação ao alvo',
            'Estabilidade da fixação',
          ],
        },
        {
          titulo: 'Requisitos',
          itens: [
            'Computador com webcam',
            'Boa iluminação e cabeça em posição estável',
            'Python',
            'OpenCV, MediaPipe, GazeTracking e Pygame',
          ],
        },
        {
          titulo: 'Precisão do rastreamento',
          pendente: 'A precisão do rastreamento ocular por webcam comum ainda está em validação. O tamanho dos alvos do jogo depende desse resultado.',
        },
        {
          titulo: 'Como rodar',
          pendente: 'As instruções de execução serão publicadas quando o app tiver uma versão distribuível.',
        },
        {
          titulo: 'Download',
          pendente: 'O link de download será adicionado junto com a primeira versão.',
        },
        {
          titulo: 'Demonstração',
          midia: { src: null, pendente: 'Vídeo de demonstração em breve' },
        },
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
