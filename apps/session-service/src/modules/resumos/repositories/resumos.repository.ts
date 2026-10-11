import { Injectable } from '@nestjs/common'
import type { Prisma, ResumoCompartilhado, Sessao, SessaoCores, SessaoReflexo } from '@prisma/client'
import { PrismaService } from '@iris/shared'

const ENCERRADAS = ['CONCLUIDA', 'CANCELADA']

@Injectable()
export class ResumosRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(dados: Prisma.ResumoCompartilhadoCreateInput): Promise<ResumoCompartilhado> {
    return this.prisma.resumoCompartilhado.create({ data: dados })
  }

  buscarPorTokenHash(tokenHash: string): Promise<ResumoCompartilhado | null> {
    return this.prisma.resumoCompartilhado.findUnique({ where: { tokenHash } })
  }

  // A partida que entra no resumo: a última CONCLUÍDA; se não houver, a última interrompida que tenha
  // dados (uma sessão cancelada sem nenhuma fase/rodada não tem o que mostrar).

  async ultimaRitmo(participanteId: string): Promise<Sessao | null> {
    const ordem = { iniciadaEm: 'desc' } as const
    return (
      (await this.prisma.sessao.findFirst({ where: { participanteId, status: 'CONCLUIDA' }, orderBy: ordem })) ??
      this.prisma.sessao.findFirst({ where: { participanteId, status: { in: ENCERRADAS }, fases: { isEmpty: false } }, orderBy: ordem })
    )
  }

  async ultimaReflexo(participanteId: string): Promise<SessaoReflexo | null> {
    const ordem = { iniciadaEm: 'desc' } as const
    return (
      (await this.prisma.sessaoReflexo.findFirst({ where: { participanteId, status: 'CONCLUIDA' }, orderBy: ordem })) ??
      this.prisma.sessaoReflexo.findFirst({
        where: { participanteId, status: { in: ENCERRADAS }, tentativas: { isEmpty: false } },
        orderBy: ordem,
      })
    )
  }

  async ultimaCores(participanteId: string): Promise<SessaoCores | null> {
    const ordem = { iniciadaEm: 'desc' } as const
    return (
      (await this.prisma.sessaoCores.findFirst({ where: { participanteId, status: 'CONCLUIDA' }, orderBy: ordem })) ??
      this.prisma.sessaoCores.findFirst({ where: { participanteId, status: { in: ENCERRADAS }, rodadas: { isEmpty: false } }, orderBy: ordem })
    )
  }

  sessaoRitmo(id: string | null): Promise<Sessao | null> {
    return id ? this.prisma.sessao.findUnique({ where: { id } }) : Promise.resolve(null)
  }

  sessaoReflexo(id: string | null): Promise<SessaoReflexo | null> {
    return id ? this.prisma.sessaoReflexo.findUnique({ where: { id } }) : Promise.resolve(null)
  }

  sessaoCores(id: string | null): Promise<SessaoCores | null> {
    return id ? this.prisma.sessaoCores.findUnique({ where: { id } }) : Promise.resolve(null)
  }
}
