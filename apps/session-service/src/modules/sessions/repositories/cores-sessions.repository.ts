import { Injectable } from '@nestjs/common'
import type { Prisma, SessaoCores } from '@prisma/client'
import { PrismaService } from '@iris/shared'
import { ehObjectId } from '../../../core/utils/object-id.js'

@Injectable()
export class CoresSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(dados: Prisma.SessaoCoresCreateInput): Promise<SessaoCores> {
    return this.prisma.sessaoCores.create({ data: dados })
  }

  /** null se o id não existir (ou nem for um ObjectId válido). */
  async buscarPorId(id: string): Promise<SessaoCores | null> {
    if (!ehObjectId(id)) return null
    return this.prisma.sessaoCores.findUnique({ where: { id } })
  }

  /** Sessões da pessoa, da mais recente para a mais antiga (índice participanteId + iniciadaEm). */
  listarPorParticipante(participanteId: string | null, limite: number): Promise<SessaoCores[]> {
    return this.prisma.sessaoCores.findMany({ where: { participanteId }, orderBy: { iniciadaEm: 'desc' }, take: limite })
  }

  /** Fecha a sessão só se ela ainda estiver em andamento (duas requisições iguais não gravam duas vezes). */
  async concluir(
    id: string,
    dados: {
      status: 'CONCLUIDA' | 'CANCELADA'
      concluidaEm: Date
      pontuacaoFinal: number | null
      maiorSequencia: number
      tempoRespostaMedioMs: number | null
      rodadas: Prisma.RodadaCoresCreateInput[]
    },
  ): Promise<boolean> {
    const { count } = await this.prisma.sessaoCores.updateMany({
      where: { id, status: 'EM_ANDAMENTO' },
      data: {
        status: dados.status,
        concluidaEm: dados.concluidaEm,
        pontuacaoFinal: dados.pontuacaoFinal,
        maiorSequencia: dados.maiorSequencia,
        tempoRespostaMedioMs: dados.tempoRespostaMedioMs,
        rodadas: { set: dados.rodadas },
      },
    })
    return count > 0
  }
}
