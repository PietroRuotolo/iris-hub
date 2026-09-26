import { Injectable } from '@nestjs/common'
import type { Prisma, Sessao } from '@prisma/client'
import { PrismaService } from '@iris/shared'
import { ehObjectId } from '../../../core/utils/object-id.js'

export interface DadosConclusao {
  concluidaEm: Date
  eventos: Prisma.EventoJogoCreateInput[]
  resumo: Prisma.ResumoSessaoCreateInput
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(dados: Prisma.SessaoCreateInput): Promise<Sessao> {
    return this.prisma.sessao.create({ data: dados })
  }

  /** null se o id não existir (ou nem for um ObjectId válido). */
  async buscarPorId(id: string): Promise<Sessao | null> {
    if (!ehObjectId(id)) return null
    return this.prisma.sessao.findUnique({ where: { id } })
  }

  /**
   * Conclui a sessão só se ela ainda estiver em andamento (atualização condicional, atômica).
   * Devolve null se ela não estava mais em andamento, por exemplo, finalizada por outra requisição.
   */
  async concluir(id: string, { concluidaEm, eventos, resumo }: DadosConclusao): Promise<Sessao | null> {
    const { count } = await this.prisma.sessao.updateMany({
      where: { id, status: 'em-andamento' },
      data: { status: 'concluida', concluidaEm, eventos: { set: eventos }, resumo: { set: resumo } },
    })
    if (count === 0) return null
    return this.prisma.sessao.findUnique({ where: { id } })
  }
}
