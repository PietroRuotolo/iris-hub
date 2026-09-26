import type { Sessao, StatusSessao } from '@iris/contracts'
import type { Sessao as SessaoRegistro } from '@prisma/client'

export class SessionResponseDto implements Sessao {
  id: string
  participanteId: string | null
  calibracaoId: string
  iniciadaEm: string
  concluidaEm: string | null
  status: StatusSessao
  totalEventos: number

  static de(doc: SessaoRegistro): SessionResponseDto {
    return Object.assign(new SessionResponseDto(), {
      id: doc.id,
      participanteId: doc.participanteId,
      calibracaoId: doc.calibracaoId,
      iniciadaEm: doc.iniciadaEm.toISOString(),
      concluidaEm: doc.concluidaEm ? doc.concluidaEm.toISOString() : null,
      status: doc.status as StatusSessao,
      totalEventos: doc.eventos.length,
    })
  }
}
