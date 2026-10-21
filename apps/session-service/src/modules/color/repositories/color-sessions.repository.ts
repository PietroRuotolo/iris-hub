import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '@iris/shared'

const COM_FASES = { rounds: true } as const

@Injectable()
export class ColorSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** A partida e as fases numa escrita só (o Prisma faz numa transação: nada fica pela metade). */
  criar(dados: Prisma.ColorSessionUncheckedCreateInput) {
    return this.prisma.colorSession.create({ data: dados, include: COM_FASES })
  }

  /** As partidas do jogador, da mais recente para a mais antiga (índice player_id + started_at). */
  listarPorJogador(playerId: string, limite: number) {
    return this.prisma.colorSession.findMany({ where: { playerId }, orderBy: { startedAt: 'desc' }, take: limite, include: COM_FASES })
  }

  buscarPorId(id: string) {
    return this.prisma.colorSession.findUnique({ where: { id }, include: COM_FASES })
  }
}