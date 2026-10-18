import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { WhatsappClient } from '../clients/whatsapp.client.js'

/** WhatsApp: texto `{ para, texto }` ou imagem `{ para, texto?, imagem: { url, tipo?, nomeArquivo? } }`. */
@Controller('whatsapp')
export class WhatsappGatewayController {
  constructor(private readonly whatsapp: WhatsappClient) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  async enviar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.whatsapp.enviar(corpo), res)
  }
}
