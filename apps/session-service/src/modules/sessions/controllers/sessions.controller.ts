import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { CreateSessionRequestDto } from '../dtos/request/create-session.request.dto.js'
import { FinishSessionRequestDto } from '../dtos/request/finish-session.request.dto.js'
import { RegisterPhaseRequestDto } from '../dtos/request/register-phase.request.dto.js'
import { SessionResponseDto } from '../dtos/response/session.response.dto.js'
import { SessionsService } from '../services/sessions.service.js'

/** Sessões do jogo de ritmo. O participanteId é preenchido pelo gateway, a partir do login. */
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessoes: SessionsService) {}

  @Post()
  async iniciar(@Body() dados: CreateSessionRequestDto): Promise<SessionResponseDto> {
    return SessionResponseDto.de(await this.sessoes.iniciar(dados))
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Query('participanteId') participanteId?: string): Promise<SessionResponseDto> {
    return SessionResponseDto.de(await this.sessoes.obter(id, participanteId))
  }

  @Post(':id/phases')
  @HttpCode(HttpStatus.OK)
  async registrarFase(@Param('id') id: string, @Body() dados: RegisterPhaseRequestDto): Promise<SessionResponseDto> {
    return SessionResponseDto.de(await this.sessoes.registrarFase(id, dados))
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async encerrar(@Param('id') id: string, @Body() dados: FinishSessionRequestDto): Promise<SessionResponseDto> {
    return SessionResponseDto.de(await this.sessoes.encerrar(id, dados))
  }
}
