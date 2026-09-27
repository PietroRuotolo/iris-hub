import type { CalibracaoSessao, FaseResumo, SessaoJogo, StatusSessao, TelaSessao } from '@iris/contracts'
import type { Sessao } from '@prisma/client'

export class SessionResponseDto implements SessaoJogo {
  id: string
  participanteId: string | null
  iniciadaEm: string
  concluidaEm: string | null
  status: StatusSessao
  tela: TelaSessao
  calibracao: CalibracaoSessao | null
  fases: FaseResumo[]
  pontuacaoTotal: number | null
  coberturaTotal: number | null
  versaoPontuacao: string

  // Campo a campo: a resposta tem sempre os mesmos campos, sem nada interno do banco.
  static de(doc: Sessao): SessionResponseDto {
    return Object.assign(new SessionResponseDto(), {
      id: doc.id,
      participanteId: doc.participanteId,
      iniciadaEm: doc.iniciadaEm.toISOString(),
      concluidaEm: doc.concluidaEm?.toISOString() ?? null,
      status: doc.status as StatusSessao,
      tela: {
        larguraPx: doc.tela.larguraPx,
        alturaPx: doc.tela.alturaPx,
        polegadas: doc.tela.polegadas ?? null,
        pxPorCm: doc.tela.pxPorCm ?? null,
      },
      calibracao: doc.calibracao
        ? {
            pontos: doc.calibracao.pontos,
            erroMedioPx: doc.calibracao.erroMedioPx ?? null,
            qualidade: doc.calibracao.qualidade ?? null,
            coberturaValida: doc.calibracao.coberturaValida ?? null,
            distanciaMediaCm: doc.calibracao.distanciaMediaCm ?? null,
            oculos: doc.calibracao.oculos ?? null,
            fracaoReflexo: doc.calibracao.fracaoReflexo ?? null,
            reflexoIgnorado: doc.calibracao.reflexoIgnorado ?? false,
          }
        : null,
      fases: doc.fases.map((f) => ({
        fase: f.fase,
        nome: f.nome,
        alvosApresentados: f.alvosApresentados,
        acertos: f.acertos,
        semResposta: f.semResposta,
        rastreamentoInsuficiente: f.rastreamentoInsuficiente,
        pontuacao: f.pontuacao,
        coberturaRastreamento: f.coberturaRastreamento ?? null,
      })),
      pontuacaoTotal: doc.pontuacaoTotal,
      coberturaTotal: doc.coberturaTotal,
      versaoPontuacao: doc.versaoPontuacao,
    })
  }
}
