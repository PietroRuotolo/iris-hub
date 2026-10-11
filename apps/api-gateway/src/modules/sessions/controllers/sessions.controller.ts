import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { SessionsClient } from '../clients/sessions.client.js'
import { HEADER_JOGADOR, ParticipanteService, comParticipante } from '../participante.service.js'

/**
 * Sessões do jogo. Exigem o jogador escolhido no site (cabeçalho x-jogador-id): o gateway confere
 * no user-service que a conta existe e envia o id dela como participanteId.
 */
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessoes: SessionsClient,
    private readonly participante: ParticipanteService,
  ) {}

  @Post()
  async iniciar(@Headers(HEADER_JOGADOR) jogadorId: string | undefined, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const participanteId = await this.participante.idDoJogador(jogadorId)
    return repassar(await this.sessoes.iniciar(comParticipante(corpo, participanteId)), res)
  }

  @Get()
  async listar(@Headers(HEADER_JOGADOR) jogadorId: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.listar(await this.participante.idDoJogador(jogadorId)), res)
  }

  @Get(':id')
  async obter(@Headers(HEADER_JOGADOR) jogadorId: string | undefined, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.obter(id, await this.participante.idDoJogador(jogadorId)), res)
  }

  @Post(':id/phases')
  @HttpCode(HttpStatus.OK)
  async registrarFase(
    @Headers(HEADER_JOGADOR) jogadorId: string | undefined,
    @Param('id') id: string,
    @Body() corpo: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const participanteId = await this.participante.idDoJogador(jogadorId)
    return repassar(await this.sessoes.registrarFase(id, comParticipante(corpo, participanteId)), res)
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async encerrar(
    @Headers(HEADER_JOGADOR) jogadorId: string | undefined,
    @Param('id') id: string,
    @Body() corpo: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const participanteId = await this.participante.idDoJogador(jogadorId)
    return repassar(await this.sessoes.encerrar(id, comParticipante(corpo, participanteId)), res)
  }
}
