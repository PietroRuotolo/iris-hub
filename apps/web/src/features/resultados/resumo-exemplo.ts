// Resumo de exemplo para as telas enquanto não há dados reais: é o que a experiência mostra sem
// nenhuma sessão carregada (valores de referência do jogo de ritmo).

export type NivelLeitura = 'adequado' | 'atencao' | 'reduzido' | 'sem-dados'

export interface SecaoResumo {
  jogo: string
  nomeJogo: string
  valoresDeReferencia: boolean
  linhas: [rotulo: string, valor: string][]
  leitura: { nivel: NivelLeitura; titulo: string; texto: string; observacoes: string[] }
}

export interface Resumo {
  data: string
  secoes: SecaoResumo[]
}

export const RESUMO_EXEMPLO: Resumo = {
  data: '26 de setembro de 2026 às 14:30',
  secoes: [
    {
      jogo: 'jogo-ritmo',
      nomeJogo: 'Jogo de ritmo por rastreamento ocular',
      valoresDeReferencia: true,
      linhas: [
        ['Sessões realizadas', '0'],
        ['Acertos', '7'],
        ['Erros', '3'],
        ['Taxa de acerto', '70%'],
        ['Tempo de resposta médio', '620 ms'],
        ['Variabilidade do tempo de resposta', '180 ms'],
        ['Precisão espacial média', '34.0 px'],
        ['Instabilidade média da fixação', '7.5 px'],
      ],
      leitura: {
        nivel: 'atencao',
        titulo: 'Atenção recomendada',
        texto:
          'Parte dos alvos não foi acompanhada no tempo previsto. Sugere-se repetir o teste e acompanhar a evolução.',
        observacoes: [],
      },
    },
  ],
}
