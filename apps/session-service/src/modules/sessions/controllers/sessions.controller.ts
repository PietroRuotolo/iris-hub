import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { CreateSessionRequestDto } from '../dtos/request/create-session.request.dto.js'
import { FinishSessionRequestDto } from '../dtos/request/finish-session.request.dto.js'
import { SessionSummaryResponseDto } from '../dtos/response/session-summary.response.dto.js'
import { SessionResponseDto } from '../dtos/response/session.response.dto.js'
import { SessionsService } from '../services/sessions.service.js'

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessoes: SessionsService) {}

  @Post()
  async iniciar(@Body() dados: CreateSessionRequestDto): Promise<SessionResponseDto> {
    return SessionResponseDto.de(await this.sessoes.iniciar(dados))
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async finalizar(@Param('id') id: string, @Body() dados: FinishSessionRequestDto): Promise<SessionResponseDto> {
    return SessionResponseDto.de(await this.sessoes.finalizar(id, dados))
  }

  @Get(':id')
  async obter(@Param('id') id: string): Promise<SessionResponseDto> {
    return SessionResponseDto.de(await this.sessoes.obter(id))
  }

  @Get(':id/summary')
  async obterResumo(@Param('id') id: string): Promise<SessionSummaryResponseDto> {
    return SessionSummaryResponseDto.de(id, await this.sessoes.obterResumo(id))
  }
}
