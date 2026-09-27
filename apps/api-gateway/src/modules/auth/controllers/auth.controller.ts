import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Inject, Post, Res } from '@nestjs/common'
import type { Logger } from '@iris/logger'
import { LOGGER } from '@iris/shared'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { EmailsClient } from '../../emails/clients/emails.client.js'
import { AuthClient } from '../clients/auth.client.js'

type UsuarioCriado = { usuario?: { email?: unknown } }

@Controller('auth')
export class AuthGatewayController {
  constructor(
    private readonly auth: AuthClient,
    private readonly emails: EmailsClient,
    @Inject(LOGGER) private readonly log: Logger,
  ) {}

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  async identificar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.auth.identificar(corpo), res)
  }

  @Post('register')
  async cadastrar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const resultado = await this.auth.cadastrar(corpo)
    if (resultado.status >= 200 && resultado.status < 300) {
      const email = (resultado.corpo as UsuarioCriado | null)?.usuario?.email
      if (typeof email === 'string' && email) this.enviarBoasVindas(email)
    }
    return repassar(resultado, res)
  }

  @Get('me')
  async obterUsuario(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return repassar(await this.auth.obterUsuario(authorization), res)
  }

  @Post('me/intro-seen')
  @HttpCode(HttpStatus.OK)
  async marcarHistoriaVista(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return repassar(await this.auth.marcarHistoriaVista(authorization), res)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sair(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return repassar(await this.auth.sair(authorization), res)
  }

  private enviarBoasVindas(email: string): void {
    void this.emails.enviar({ para: email, template: 'welcome' }).then((resposta) => {
      if (resposta.status >= 400) this.log.warn('Falha ao enviar e-mail de boas-vindas', { status: resposta.status })
    }).catch(() => {
      this.log.warn('Serviço de e-mail indisponível; cadastro concluído sem e-mail de boas-vindas')
    })
  }
}
