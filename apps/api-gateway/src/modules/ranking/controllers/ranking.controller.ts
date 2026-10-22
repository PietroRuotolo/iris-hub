import { Controller, Get, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { RankingClient } from '../clients/ranking.client.js'

/**
 * O ranking geral dos três jogos (a tela inicial do site). Diferente das partidas, não depende do
 * jogador escolhido: é o mesmo para todos (só nomes e notas; nada de e-mail ou telefone).
 */
@Controller('ranking')
export class RankingController {
  constructor(private readonly ranking: RankingClient) {}

  @Get()
  async geral(@Query('limite') limite: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.ranking.geral(limite), res)
  }
}