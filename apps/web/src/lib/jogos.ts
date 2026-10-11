// Catálogo dos jogos da plataforma: fonte única dos nomes, rotas, ícones e textos de apresentação.
// Início, menu, apresentações e histórico leem daqui; não copie estes dados para dentro das features.

import { Eye, Palette, Zap, type LucideIcon } from 'lucide-react'

export type StatusJogo = 'disponivel' | 'desenvolvimento'

/** Como cada jogo é identificado nas sessões salvas (e no `?jogo=` da página de resumo). */
export type ChaveJogo = 'ritmo' | 'reflexo' | 'cores'

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
  chave: ChaveJogo
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
    chave: 'ritmo',
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
          titulo: 'Demonstração',
          midia: { src: null, pendente: 'Vídeo de demonstração em breve' },
        },
      ],
    },
  },
  {
    id: 'jogo-reflexo',
    chave: 'reflexo',
    rota: '/jogo-reflexo',
    nome: 'Jogo do reflexo',
    tipo: 'Hardware ESP32 (teste de reação)',
    descricao: 'Avaliação do tempo de reação motora simples a um estímulo visual, com o botão físico do ESP32.',
    status: 'disponivel',
    Icone: Zap,
    apresentacao: {
      aviso:
        'Conecta ao ESP32 pelo navegador (Web Serial, 115200 bps). O ESP32 sorteia a espera e mede o tempo de reação; o site mostra o sinal e guarda as rodadas.',
      secoes: [
        {
          titulo: 'O que é',
          texto:
            'Teste psicomotor de tempo de reação visual simples. A pessoa aguarda o sinal verde e aperta o botão físico o mais rápido possível, sem queimar a largada.',
        },
        {
          titulo: 'Jogar',
          texto: 'Conecte o ESP32 pela USB, aguarde o sinal verde e aperte o botão. Ao terminar, clique em "Encerrar e salvar sessão".',
          link: { href: '/jogo-reflexo', label: 'Começar partida' },
        },
        {
          titulo: 'Como funciona',
          ordenada: true,
          itens: [
            'Espera: o ESP32 fica em espera por um tempo aleatório. Não aperte ainda.',
            'Estímulo: a área fica verde e aparece "Reagir agora!".',
            'Reação: o tempo entre o sinal e o botão é medido em milissegundos (ms).',
            'Largada queimada: apertar antes do sinal registra a rodada sem tempo de reação.',
          ],
        },
        {
          titulo: 'Dados registrados',
          itens: [
            'Tempo de reação de cada rodada (ms)',
            'Tempo médio e melhor tempo',
            'Largadas queimadas',
          ],
        },
        {
          titulo: 'Requisitos',
          itens: [
            'Navegador com Web Serial (Chrome ou Edge)',
            'Cabo USB ligado ao computador',
            'ESP32 com o firmware do jogo do reflexo',
          ],
        },
      ],
    },
  },
  {
    id: 'jogo-cores',
    chave: 'cores',
    rota: '/jogo-cores',
    nome: 'Jogo das cores',
    tipo: 'Hardware ESP32 (Genius)',
    descricao: 'Jogo de memória sequencial com estímulos visuais e sonoros de 5 cores, jogado nos botões do ESP32.',
    status: 'disponivel',
    Icone: Palette,
    apresentacao: {
      aviso:
        'Conecta ao ESP32 pelo navegador (Web Serial, 115200 bps). O som das cores é gerado no próprio navegador e sincronizado com os botões físicos.',
      secoes: [
        {
          titulo: 'O que é',
          texto:
            'Jogo de memória estilo Genius com 5 cores e sons distintos. O circuito sorteia sequências que crescem a cada acerto, até o primeiro erro.',
        },
        {
          titulo: 'Jogar',
          texto: 'Conecte o ESP32 pela USB e clique em "Iniciar partida". A partida é salva sozinha quando termina.',
          link: { href: '/jogo-cores', label: 'Jogar agora' },
        },
        {
          titulo: 'Como funciona',
          ordenada: true,
          itens: [
            'Conexão: escolha a porta serial do ESP32 no botão de conexão USB.',
            'Estímulo: observe a ordem das luzes e dos sons das 5 cores.',
            'Reprodução: aperte os botões físicos na mesma ordem.',
            'Progressão: cada rodada certa acrescenta uma cor à sequência, até o primeiro erro.',
          ],
        },
        {
          titulo: 'Dados registrados',
          itens: ['Maior sequência repetida sem erro', 'Tempo de resposta de cada rodada', 'Pontuação final informada pelo ESP32'],
        },
        {
          titulo: 'Requisitos',
          itens: [
            'Navegador com Web Serial (Chrome ou Edge)',
            'Cabo USB ligado ao computador',
            'ESP32 com o firmware do Genius de 5 cores',
          ],
        },
      ],
    },
  },
]

/** O jogo pela chave das sessões salvas. */
export function jogoPorChave(chave: ChaveJogo): Jogo {
  const jogo = JOGOS.find((j) => j.chave === chave)
  if (!jogo) throw new Error(`Jogo desconhecido: ${chave}`)
  return jogo
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
