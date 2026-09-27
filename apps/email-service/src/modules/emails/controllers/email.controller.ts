import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { SendEmailRequestDto } from '../dtos/request/send-email.request.dto.js'
import { EmailService } from '../services/email.service.js'

@Controller('emails')
export class EmailController {
  constructor(private readonly email: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  enviar(@Body() dados: SendEmailRequestDto) {
    return this.email.enviar(dados)
  }
}
