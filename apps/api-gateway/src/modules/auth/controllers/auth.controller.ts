import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { AuthClient } from '../clients/auth.client.js'

@Controller('auth')
export class AuthGatewayController {
  constructor(private readonly auth: AuthClient) {}

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  async identificar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.auth.identificar(corpo), res)
  }

  @Post('register')
  async cadastrar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.auth.cadastrar(corpo), res)
  }

  @Get('me')
  async obterUsuario(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return repassar(await this.auth.obterUsuario(authorization), res)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sair(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return repassar(await this.auth.sair(authorization), res)
  }
}
