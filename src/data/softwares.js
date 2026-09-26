import { Eye } from 'lucide-react'

// Fonte única dos softwares do hub: alimenta o menu, os cards e as rotas.
// O iris (front-end web) NÃO faz parte do hub: é apenas a referência visual.
// Nome final do jogo de ritmo ainda será definido.
// O neuro-demo e o back-end foram retirados do hub por decisão do time.
export const SOFTWARES = [
  {
    id: 'jogo-ritmo',
    rota: '/jogo-ritmo',
    nome: 'Jogo de ritmo',
    tipo: 'Aplicação web (webcam)',
    descricao: 'Jogo de ritmo controlado pelo olhar, que gera dados de acompanhamento para triagem neurológica.',
    status: 'desenvolvimento',
    Icone: Eye,
    detalhes: {
      aviso: 'Roda direto no navegador, usando a webcam (MediaPipe Tasks Vision). Nenhuma imagem sai do computador: o rastreamento acontece localmente.',
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
            'Navegador com câmera (Chrome ou Edge recomendados)',
            'Boa iluminação e cabeça em posição estável',
            'Conexão com internet (carrega o modelo do MediaPipe)',
          ],
        },
        {
          titulo: 'Fase 0 — validação de precisão',
          texto: 'Antes de qualquer mecânica de jogo, é preciso medir o erro do rastreamento ocular pela webcam. Este protótipo mede esse erro e decide se o tamanho de alvo planejado é viável.',
          link: { to: '/jogo-ritmo/fase-0', label: 'Testar precisão do rastreamento' },
        },
        {
          titulo: 'Mecânica do jogo',
          pendente: 'Ainda não construída: depende do resultado da Fase 0 (erro medido define o tamanho mínimo dos alvos).',
        },
        {
          titulo: 'Demonstração',
          midia: { src: null, pendente: 'Vídeo de demonstração em breve' },
        },
      ],
    },
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
