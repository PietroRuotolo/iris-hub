import type { RodadaCores, SessaoCores } from '@iris/contracts'
import type { SessaoCores as SessaoCoresDoc } from '@prisma/client'

export class CoresSessionResponseDto implements SessaoCores {
  id: string
  participanteId: string | null
  iniciadaEm: string
  concluidaEm: string | null
  status: SessaoCores['status']
  pontuacaoFinal: number | null
  maiorSequencia: number | null
  tempoRespostaMedioMs: number | null
  rodadas: RodadaCores[]

  // Campo a campo: a resposta tem sempre os mesmos campos, sem nada interno do banco.
  static de(doc: SessaoCoresDoc): CoresSessionResponseDto {
    return Object.assign(new CoresSessionResponseDto(), {
      id: doc.id,
      participanteId: doc.participanteId ?? null,
      iniciadaEm: doc.iniciadaEm.toISOString(),
      concluidaEm: doc.concluidaEm?.toISOString() ?? null,
      status: doc.status as SessaoCores['status'],
      pontuacaoFinal: doc.pontuacaoFinal ?? null,
      maiorSequencia: doc.maiorSequencia ?? null,
      tempoRespostaMedioMs: doc.tempoRespostaMedioMs ?? null,
      rodadas: doc.rodadas.map((r) => ({
        rodada: r.rodada,
        tamanhoSequencia: r.tamanhoSequencia,
        acertou: r.acertou,
        tempoRespostaMs: r.tempoRespostaMs ?? null,
      })),
    })
  }
}
