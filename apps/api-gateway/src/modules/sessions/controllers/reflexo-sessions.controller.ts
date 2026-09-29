import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { JogosSessionsClient } from '../clients/jogos-sessions.client.js'
import { ParticipanteService, comParticipante } from '../participante.service.js'

/**
 * Sessões do jogo de reflexo. Exigem login: o gateway descobre a pessoa pelo token e envia o id dela
 * como participanteId. Vem ANTES do SessionsController no módulo (`GET /sessions/reflexo` não pode
 * cair em `GET /sessions/:id`).
 */
@Controller('sessions/reflexo')
export class ReflexoSessionsController {
  constructor(
    private readonly sessoes: JogosSessionsClient,
    private readonly participante: ParticipanteService,
  ) {}

  @Post()
  async iniciar(@Headers('authorization') authorization: string | undefined, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const participanteId = await this.participante.doLogin(authorization)
    return repassar(await this.sessoes.iniciar('reflexo', comParticipante(corpo, participanteId)), res)
  }

  @Get()
  async listar(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.listar('reflexo', await this.participante.doLogin(authorization)), res)
  }

  @Get(':id')
  async obter(@Headers('authorization') authorization: string | undefined, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.obter('reflexo', id, await this.participante.doLogin(authorization)), res)
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
    return repassar(await this.sessoes.encerrar('reflexo', id, comParticipante(corpo, participanteId)), res)
  }
}
