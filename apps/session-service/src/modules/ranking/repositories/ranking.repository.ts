import { Injectable } from '@nestjs/common'
import { PrismaService } from '@iris/shared'

/** A melhor pontuação de um jogador num jogo, na escala do jogo. */
export interface Melhor {
  playerId: string
  pontos: number
}

@Injectable()
export class RankingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** A melhor partida CONCLUÍDA de cada jogador, em cada jogo (o MongoDB agrupa: uma linha por jogador). */
  async melhoresPorJogo(): Promise<{ ritmo: Melhor[]; reflexo: Melhor[]; cores: Melhor[] }> {
    const [ritmo, reflexo, cores] = await Promise.all([
      this.prisma.rhythmSession.groupBy({ by: ['playerId'], where: { status: 'completed' }, _max: { totalScore: true } }),
      this.prisma.reflexSession.groupBy({ by: ['playerId'], where: { status: 'completed' }, _max: { totalScore: true } }),
      this.prisma.colorSession.groupBy({ by: ['playerId'], where: { status: 'completed' }, _max: { score: true } }),
    ])
    // Uma partida do ritmo sem nenhuma fase válida fica sem nota (null): quem só tem dessas não conta.
    const comNota = (playerId: string, pontos: number | null): Melhor[] => (pontos === null ? [] : [{ playerId, pontos }])
    return {
      ritmo: ritmo.flatMap((g) => comNota(g.playerId, g._max.totalScore)),
      reflexo: reflexo.flatMap((g) => comNota(g.playerId, g._max.totalScore)),
      cores: cores.flatMap((g) => comNota(g.playerId, g._max.score)),
    }
  }

  /** Só o nome de cada jogador (o ranking não mostra e-mail nem telefone). */
  nomes(ids: string[]) {
    return this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true } })
  }
}