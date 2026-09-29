import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Res, UnauthorizedException } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { AuthClient } from '../../auth/clients/auth.client.js'
import { SessionsClient } from '../clients/sessions.client.js'

type RespostaMe = { usuario?: { id?: unknown } } | null

/**
 * Sessões do jogo. Exigem login: o gateway descobre a pessoa pelo token (user-service) e envia o
 * id dela como participanteId, então o site não escolhe de quem é a sessão.
 */
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessoes: SessionsClient,
    private readonly auth: AuthClient,
  ) {}

  @Post()
  async iniciar(@Headers('authorization') authorization: string | undefined, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const participanteId = await this.participante(authorization)
    return repassar(await this.sessoes.iniciar(comParticipante(corpo, participanteId)), res)
  }

  @Get()
  async listar(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.listar(await this.participante(authorization)), res)
  }

  @Get(':id')
  async obter(@Headers('authorization') authorization: string | undefined, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.obter(id, await this.participante(authorization)), res)
  }

  @Post(':id/phases')
  @HttpCode(HttpStatus.OK)
  async registrarFase(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() corpo: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const participanteId = await this.participante(authorization)
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
    const participanteId = await this.participante(authorization)
    return repassar(await this.sessoes.encerrar(id, comParticipante(corpo, participanteId)), res)
  }

  private async participante(authorization: string | undefined): Promise<string> {
    if (!authorization) throw new UnauthorizedException('Faça login para jogar')
    const { status, corpo } = await this.auth.obterUsuario(authorization)
    const id = (corpo as RespostaMe)?.usuario?.id
    if (status !== 200 || typeof id !== 'string') throw new UnauthorizedException('Sessão de login inválida ou expirada')
    return id
  }
}

/** O participanteId do corpo sempre vem do login, nunca do que o site mandou. */
function comParticipante(corpo: unknown, participanteId: string): Record<string, unknown> {
  const base = typeof corpo === 'object' && corpo !== null && !Array.isArray(corpo) ? corpo : {}
  return { ...base, participanteId }
}
