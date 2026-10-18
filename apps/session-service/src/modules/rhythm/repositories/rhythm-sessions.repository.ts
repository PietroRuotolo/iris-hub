import { Injectable } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaService } from '@iris/shared'

const COM_FASES = { phases: { include: { targets: true } } } as const

@Injectable()
export class RhythmSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** A partida, as fases e os alvos numa escrita só (o Prisma faz numa transação: nada fica pela metade). */
  criar(dados: Prisma.RhythmSessionUncheckedCreateInput) {
    return this.prisma.rhythmSession.create({ data: dados, include: COM_FASES })
  }

  /** As partidas do jogador, da mais recente para a mais antiga (índice player_id + started_at). */
  listarPorJogador(playerId: string, limite: number) {
    return this.prisma.rhythmSession.findMany({ where: { playerId }, orderBy: { startedAt: 'desc' }, take: limite, include: COM_FASES })
  }

  buscarPorId(id: string) {
    return this.prisma.rhythmSession.findUnique({ where: { id }, include: COM_FASES })
  }
}
