import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { CalibrationsClient } from '../clients/calibrations.client.js'

/** Mesmas rotas do session-service; status e corpo da resposta vêm dele. */
@Controller('calibrations')
export class CalibrationsController {
  constructor(private readonly calibracoes: CalibrationsClient) {}

  @Post()
  async criar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.calibracoes.criar(corpo), res)
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.calibracoes.obter(id), res)
  }
}
