import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { SendWhatsappRequestDto } from '../dtos/request/send-whatsapp.request.dto.js'
import { WhatsappService } from '../services/whatsapp.service.js'

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsapp: WhatsappService) {}

  /** Texto, ou imagem com legenda. 503 sem as variáveis configuradas; 502 se o provedor recusar. */
  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  enviar(@Body() dados: SendWhatsappRequestDto) {
    return this.whatsapp.enviar(dados)
  }
}
