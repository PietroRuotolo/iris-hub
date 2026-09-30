import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { CreateReflexSessionRequestDto } from '../dtos/request/create-reflex-session.request.dto.js'
import { FinishReflexSessionRequestDto } from '../dtos/request/finish-reflex-session.request.dto.js'
import { ReflexSessionResponseDto } from '../dtos/response/reflex-session.response.dto.js'
import { ReflexSessionsService } from '../services/reflex-sessions.service.js'

/**
 * Sessões do jogo de reflexo. O participanteId é preenchido pelo gateway, a partir do login.
 *
 * Este controller precisa vir ANTES do SessionsController no módulo: `GET /sessions/reflexo` seria
 * capturada por `GET /sessions/:id` (com id = "reflexo") se o outro viesse primeiro.
 */
@Controller('sessions/reflexo')
export class ReflexSessionsController {
  constructor(private readonly sessoes: ReflexSessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async iniciar(@Body() dados: CreateReflexSessionRequestDto): Promise<ReflexSessionResponseDto> {
    return ReflexSessionResponseDto.de(await this.sessoes.iniciar(dados))
  }

  /** Histórico da pessoa, da sessão mais recente para a mais antiga. */
  @Get()
  async listar(@Query('participanteId') participanteId?: string, @Query('limite') limite?: string): Promise<ReflexSessionResponseDto[]> {
    const sessoes = await this.sessoes.listar(participanteId ?? null, limite === undefined ? undefined : Number(limite))
    return sessoes.map((sessao) => ReflexSessionResponseDto.de(sessao))
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Query('participanteId') participanteId?: string): Promise<ReflexSessionResponseDto> {
    return ReflexSessionResponseDto.de(await this.sessoes.obter(id, participanteId))
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async concluir(@Param('id') id: string, @Body() dados: FinishReflexSessionRequestDto): Promise<ReflexSessionResponseDto> {
    return ReflexSessionResponseDto.de(await this.sessoes.concluir(id, dados))
  }
}
