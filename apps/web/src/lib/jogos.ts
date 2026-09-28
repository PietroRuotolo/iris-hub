import { Eye, Palette, Zap, type LucideIcon } from 'lucide-react'

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

export const JOGOS: Jogo[] = [
  {
    id: 'jogo-ritmo',
    rota: '/jogo',
    nome: 'Jogo de ritmo',
    tipo: 'Aplicação web (webcam)',
    descricao: 'Jogo de ritmo controlado pelo olhar, que gera dados de acompanhamento para triagem neurológica.',
    status: 'disponivel',
    Icone: Eye,
    apresentacao: {
      aviso:
        'Roda direto no navegador, usando a webcam (MediaPipe Tasks Vision). Nenhuma imagem sai do computador: o rastreamento acontece localmente.',
      secoes: [
        {
          titulo: 'O que é',
          texto:
            'Jogo de ritmo inspirado no osu!, em que o cursor é substituído pelo olhar. Alvos aparecem na tela e a pessoa deve olhar para eles dentro de uma janela de tempo, sem clicar em nada. O objetivo é gerar dados de acompanhamento que apoiem a triagem de doenças neurodegenerativas.',
        },
        {
          titulo: 'Jogar',
          texto:
            'A partida começa pela calibração: olhe para cada ponto até o anel fechar. Depois vêm as cinco fases; entre elas, você escolhe continuar ou parar (sem escolha em 5 segundos, o jogo continua). O tamanho dos alvos segue a tela escolhida em Configurações.',
          link: { href: '/partida', label: 'Começar partida' },
        },
        {
          titulo: 'Como funciona',
          ordenada: true,
          itens: [
            'Calibração: a pessoa olha para 9 pontos na tela, e mais 5 para conferir a precisão.',
            'Os alvos aparecem no ritmo: um anel se fecha até o momento da batida.',
            'Acerto: entrar no alvo até meio segundo antes ou depois da batida e ficar nele por pelo menos 250 ms.',
            'Cada acerto vale de 50 a 100 pontos, conforme a pontualidade e a precisão. Ao final, a partida mostra a pontuação de cada fase.',
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
            'Navegador com câmera (Chrome ou Edge recomendados)',
            'Boa iluminação e cabeça em posição estável',
            'Conexão com internet (carrega o modelo do MediaPipe)',
          ],
        },
      ],
    },
  },
  {
    id: 'jogo-reflexo',
    rota: '/jogo-reflexo',
    nome: 'Jogo de reflexo',
    tipo: 'Aplicação web (teste de reação)',
    descricao: 'Avaliação de tempo de reação motora simples a estímulos visuais na tela.',
    status: 'disponivel',
    Icone: Zap,
    apresentacao: {
      aviso:
        'Roda direto no navegador ou conectado ao ESP32. O objetivo é acionar o botão assim que a área mudar para verde.',
      secoes: [
        {
          titulo: 'O que é',
          texto:
            'Teste psicomotor de tempo de reação visual simples com aferição em milissegundos.',
        },
        {
          titulo: 'Jogar',
          texto:
            'Aguarde o sinal verde e acione imediatamente.',
          link: { href: '/jogo-reflexo', label: 'Começar partida' },
        },
      ],
    },
  },
  {
    id: 'jogo-cores',
    rota: '/jogo-cores',
    nome: 'Jogo das cores',
    tipo: 'Hardware ESP32 (Genius)',
    descricao: 'Jogo de memória sequencial com estímulos visuais e sonoros de 5 cores via porta serial.',
    status: 'disponivel',
    Icone: Palette,
    apresentacao: {
      aviso:
        'Conexão direta via Web Serial a 115200 bps. O jogo sincroniza áudio local e botões físicos do ESP32.',
      secoes: [
        {
          titulo: 'O que é',
          texto:
            'Jogo de memória estilo Genius com 5 cores e frequências sonoras distintas geradas pelo circuito.',
        },
        {
          titulo: 'Jogar',
          texto:
            'Conecte o ESP32 via USB no navegador e clique em Iniciar Partida.',
          link: { href: '/jogo-cores', label: 'Jogar agora' },
        },
      ],
    },
  },
]

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