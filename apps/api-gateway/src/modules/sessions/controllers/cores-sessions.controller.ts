import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { JogosSessionsClient } from '../clients/jogos-sessions.client.js'
import { ParticipanteService, comParticipante } from '../participante.service.js'

/**
 * Sessões do jogo das cores. Exigem login: o gateway descobre a pessoa pelo token e envia o id dela
 * como participanteId. Vem ANTES do SessionsController no módulo (`GET /sessions/cores` não pode
 * cair em `GET /sessions/:id`).
 */
@Controller('sessions/cores')
export class CoresSessionsController {
  constructor(
    private readonly sessoes: JogosSessionsClient,
    private readonly participante: ParticipanteService,
  ) {}

  @Post()
  async iniciar(@Headers('authorization') authorization: string | undefined, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const participanteId = await this.participante.doLogin(authorization)
    return repassar(await this.sessoes.iniciar('cores', comParticipante(corpo, participanteId)), res)
  }

  @Get()
  async listar(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.listar('cores', await this.participante.doLogin(authorization)), res)
  }

  @Get(':id')
  async obter(@Headers('authorization') authorization: string | undefined, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.obter('cores', id, await this.participante.doLogin(authorization)), res)
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
    return repassar(await this.sessoes.encerrar('cores', id, comParticipante(corpo, participanteId)), res)
  }
}
