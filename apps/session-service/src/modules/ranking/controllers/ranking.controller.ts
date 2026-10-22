import { Controller, Get, Query } from '@nestjs/common'
import type { LinhaRankingGeral } from '@iris/contracts'
import { RankingService } from '../services/ranking.service.js'

/** O ranking geral dos três jogos (a tela inicial do site). Não depende do jogador escolhido. */
@Controller('ranking')
export class RankingController {
  constructor(private readonly ranking: RankingService) {}

  /** Só quem jogou os 3 jogos, da maior nota geral para a menor (50 por padrão, 200 no máximo). */
  @Get()
  geral(@Query('limite') limite?: string): Promise<LinhaRankingGeral[]> {
    return this.ranking.geral(limite === undefined ? undefined : Number(limite))
  }
}