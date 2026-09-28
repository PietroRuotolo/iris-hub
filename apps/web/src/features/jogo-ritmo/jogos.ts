import { Eye, Zap, type LucideIcon, Palette} from 'lucide-react'

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
        {
          titulo: 'Fases',
          ordenada: true,
          itens: [
            'Familiarização: alvos grandes, ritmo lento e sequência simples para aprender a jogar com o olhar.',
            'Ritmo constante: alvos em batidas regulares e posições previsíveis.',
            'Alternância: o olhar acompanha alvos que mudam de lado e de altura seguindo o ritmo.',
            'Precisão e velocidade: alvos menores e intervalos mais curtos, aumentando a exigência aos poucos.',
            'Desafio final: combina posições, ritmos e pausas das fases anteriores.',
          ],
        },
        {
          titulo: 'Demonstração',
          midia: { src: null, pendente: 'Vídeo de demonstração em breve' },
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
        'Roda direto no navegador. O objetivo é clicar na tela o mais rápido possível assim que a área mudar para verde.',
      secoes: [
        {
          titulo: 'O que é',
          texto:
            'Teste psicomotor clássico de tempo de reação visual simples. O participante aguarda a alteração de cor da tela e deve clicar imediatamente após o sinal verde surgir, sem queimar a largada.',
        },
        {
          titulo: 'Jogar',
          texto:
            'A partida começa no modo de espera: aguarde o quadrado ficar verde e clique o mais rápido que conseguir. Clicar antes da hora registra falta (cedo demais).',
          link: { href: '#', label: 'Começar partida' },
        },
        {
          titulo: 'Como funciona',
          ordenada: true,
          itens: [
            'Preparação: o sistema entra em espera por um tempo aleatório entre 2 e 5 segundos.',
            'Estímulo: a tela fica verde e aparece a palavra "Clique!".',
            'Acionamento: o tempo de reação até o clique é medido em milissegundos (ms).',
            'Falta de largada: clicar antes da cor verde anula a tentativa com o aviso "Cedo demais".',
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
        'Conexão direta via Web Serial a 115200 bps. O jogo utiliza Web Audio API localmente e sincroniza as entradas dos 5 botões físicos do ESP32.',
      secoes: [
        {
          titulo: 'O que é',
          texto:
            'Jogo clássico de memória estilo Genius com 5 cores e frequências sonoras distintas. O circuito sorteia sequências progressivas e valida as respostas do jogador em tempo real.',
        },
        {
          titulo: 'Jogar',
          texto:
            'Conecte o ESP32 via USB no navegador e clique em Iniciar Partida para receber as sequências no circuito.',
          link: { href: '/jogo-cores', label: 'Jogar agora' },
        },
        {
          titulo: 'Como funciona',
          ordenada: true,
          itens: [
            'Conexão: selecione a porta serial do ESP32 no botão de conexão USB.',
            'Estímulo: observe a ordem das luzes e os tons de áudio das 5 cores.',
            'Reprodução: pressione os botões físicos na mesma ordem em que foram apresentados.',
            'Progressão: cada rodada concluída adiciona uma nova cor à sequência até o primeiro erro.',
          ],
        },
        {
          titulo: 'Dados registrados',
          itens: [
            'Fase máxima atingida',
            'Maior sequência de acertos (recorde)',
            'Status de resposta em tempo real',
          ],
        },
        {
          titulo: 'Requisitos',
          itens: [
            'Navegador compatível com Web Serial (Chrome ou Edge)',
            'Cabo USB conectado ao computador',
            'ESP32 configurado com o firmware do Genius de 5 cores',
          ],
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