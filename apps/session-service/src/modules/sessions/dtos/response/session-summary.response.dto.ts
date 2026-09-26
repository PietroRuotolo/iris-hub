import type { ResumoSessao } from '@iris/contracts'

export class SessionSummaryResponseDto implements ResumoSessao {
  sessaoId: string
  acertos: number
  erros: number
  taxaAcerto: number | null
  tempoRespostaMedioMs: number | null
  tempoRespostaDesvioPadraoMs: number | null
  precisaoMediaPx: number | null
  variabilidadeFixacaoPx: number | null

  // Campo a campo, para a resposta ter sempre os mesmos campos, na mesma ordem.
  static de(sessaoId: string, resumo: Omit<ResumoSessao, 'sessaoId'>): SessionSummaryResponseDto {
    return Object.assign(new SessionSummaryResponseDto(), {
      sessaoId,
      acertos: resumo.acertos,
      erros: resumo.erros,
      taxaAcerto: resumo.taxaAcerto ?? null,
      tempoRespostaMedioMs: resumo.tempoRespostaMedioMs ?? null,
      tempoRespostaDesvioPadraoMs: resumo.tempoRespostaDesvioPadraoMs ?? null,
      precisaoMediaPx: resumo.precisaoMediaPx ?? null,
      variabilidadeFixacaoPx: resumo.variabilidadeFixacaoPx ?? null,
    })
  }
}
