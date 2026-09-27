import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { EmailsClient } from '../clients/emails.client.js'

@Controller('emails')
export class EmailsGatewayController {
  constructor(private readonly emails: EmailsClient) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async enviar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.emails.enviar(corpo), res)
  }
}
