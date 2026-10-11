import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { UsersClient } from '../clients/users.client.js'

/** Contas dos jogadores: mesmas rotas do user-service; status e corpo vêm dele. */
@Controller('users')
export class UsersController {
  constructor(private readonly usuarios: UsersClient) {}

  /** Rota só de criação de conta (página /cadastro do site). */
  @Post()
  async criar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.criar(corpo), res)
  }

  @Get()
  async buscar(@Query('busca') busca: string | undefined, @Query('limite') limite: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.buscar(busca ?? '', limite), res)
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.obter(id), res)
  }

  @Post(':id/intro-seen')
  @HttpCode(HttpStatus.OK)
  async marcarHistoriaVista(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.marcarHistoriaVista(id), res)
  }
}
