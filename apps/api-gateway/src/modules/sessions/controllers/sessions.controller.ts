import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { SessionsClient } from '../clients/sessions.client.js'

/** Mesmas rotas do session-service; status e corpo da resposta vêm dele. */
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessoes: SessionsClient) {}

  @Post()
  async iniciar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.iniciar(corpo), res)
  }

  @Post(':id/finish')
  async finalizar(@Param('id') id: string, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.finalizar(id, corpo), res)
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.obter(id), res)
  }

  @Get(':id/summary')
  async obterResumo(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.sessoes.obterResumo(id), res)
  }
}
