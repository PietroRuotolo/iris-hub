import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { SessionsClient } from '../clients/sessions.client.js'
import { ParticipanteService, comParticipante } from '../participante.service.js'

/**
 * Sessões do jogo. Exigem login: o gateway descobre a pessoa pelo token (user-service) e envia o
 * id dela como participanteId, então o site não escolhe de quem é a sessão.
 */
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessoes: SessionsClient,
    private readonly participante: ParticipanteService,
  ) {}

  @Post()
  async iniciar(@Headers('authorization') authorization: string | undefined, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const participanteId = await this.participante.doLogin(authorization)
    return repassar(await this.sessoes.iniciar(comParticipante(corpo, participanteId)), res)
  }

  @Get()
  async listar(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.listar(await this.participante.doLogin(authorization)), res)
  }

  @Get(':id')
  async obter(@Headers('authorization') authorization: string | undefined, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.obter(id, await this.participante.doLogin(authorization)), res)
  }

  @Post(':id/phases')
  @HttpCode(HttpStatus.OK)
  async registrarFase(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() corpo: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const participanteId = await this.participante.doLogin(authorization)
    return repassar(await this.sessoes.registrarFase(id, comParticipante(corpo, participanteId)), res)
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async encerrar(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() corpo: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const participanteId = await this.participante.doLogin(authorization)
    return repassar(await this.sessoes.encerrar(id, comParticipante(corpo, participanteId)), res)
  }
}
