import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '@iris/shared'

const COM_FASES = { attempts: true } as const

@Injectable()
export class ReflexSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** A partida e as fases numa escrita só (o Prisma faz numa transação: nada fica pela metade). */
  criar(dados: Prisma.ReflexSessionUncheckedCreateInput) {
    return this.prisma.reflexSession.create({ data: dados, include: COM_FASES })
  }

  /** As partidas do jogador, da mais recente para a mais antiga (índice player_id + started_at). */
  listarPorJogador(playerId: string, limite: number) {
    return this.prisma.reflexSession.findMany({ where: { playerId }, orderBy: { startedAt: 'desc' }, take: limite, include: COM_FASES })
  }

  buscarPorId(id: string) {
    return this.prisma.reflexSession.findUnique({ where: { id }, include: COM_FASES })
  }
}