import { Body, Controller, Get, Headers, Param, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { HEADER_JOGADOR, JogadorService } from '../../users/jogador.service.js'
import { ColorSessionsClient } from '../clients/color-sessions.client.js'

/**
 * Partidas do jogo das cores. Exigem o jogador escolhido no site (cabeçalho x-jogador-id): o gateway
 * confere que a conta existe e manda o id dela como playerId (o que o site mandar no corpo é ignorado).
 */
@Controller('color-sessions')
export class ColorSessionsController {
  constructor(
    private readonly partidas: ColorSessionsClient,
    private readonly jogador: JogadorService,
  ) {}

  @Post()
  async criar(@Headers(HEADER_JOGADOR) jogadorId: string | undefined, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const playerId = await this.jogador.idDoJogador(jogadorId)
    const base = typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo) ? corpo : {}
    return repassar(await this.partidas.criar({ ...base, playerId }), res)
  }

  @Get()
  async listar(@Headers(HEADER_JOGADOR) jogadorId: string | undefined, @Query('limite') limite: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.partidas.listar(await this.jogador.idDoJogador(jogadorId), limite), res)
  }

  @Get(':id')
  async obter(@Headers(HEADER_JOGADOR) jogadorId: string | undefined, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.partidas.obter(id, await this.jogador.idDoJogador(jogadorId)), res)
  }
}