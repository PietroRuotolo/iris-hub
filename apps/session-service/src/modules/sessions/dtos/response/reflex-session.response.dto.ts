import type { AcionamentoReflexo, SessaoReflexo, StatusSessaoSimples, TentativaReflexo } from '@iris/contracts'
import type { SessaoReflexo as SessaoReflexoDoc } from '@prisma/client'

export class ReflexSessionResponseDto implements SessaoReflexo {
  id: string
  participanteId: string | null
  iniciadaEm: string
  concluidaEm: string | null
  status: StatusSessaoSimples
  tempoMedioMs: number | null
  melhorTempoMs: number | null
  tentativas: TentativaReflexo[]

  // Campo a campo: a resposta tem sempre os mesmos campos, sem nada interno do banco.
  static de(doc: SessaoReflexoDoc): ReflexSessionResponseDto {
    return Object.assign(new ReflexSessionResponseDto(), {
      id: doc.id,
      participanteId: doc.participanteId ?? null,
      iniciadaEm: doc.iniciadaEm.toISOString(),
      concluidaEm: doc.concluidaEm?.toISOString() ?? null,
      status: doc.status as StatusSessaoSimples,
      tempoMedioMs: doc.tempoMedioMs ?? null,
      melhorTempoMs: doc.melhorTempoMs ?? null,
      tentativas: doc.tentativas.map((t) => ({
        rodada: t.rodada,
        tempoEsperaMs: t.tempoEsperaMs,
        tempoReacaoMs: t.tempoReacaoMs ?? null,
        queimou: t.queimou,
        acionamento: t.acionamento as AcionamentoReflexo,
      })),
    })
  }
}
