import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { CreateCoresSessionRequestDto } from '../dtos/request/create-cores-session.request.dto.js'
import { FinishCoresSessionRequestDto } from '../dtos/request/finish-cores-session.request.dto.js'
import { CoresSessionResponseDto } from '../dtos/response/cores-session.response.dto.js'
import { CoresSessionsService } from '../services/cores-sessions.service.js'

/**
 * Sessões do jogo das cores. O participanteId é preenchido pelo gateway, a partir do login.
 * Vem ANTES do SessionsController no módulo, pelo mesmo motivo do reflexo (`GET /sessions/cores`
 * seria capturada por `GET /sessions/:id`).
 */
@Controller('sessions/cores')
export class CoresSessionsController {
  constructor(private readonly sessoes: CoresSessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async iniciar(@Body() dados: CreateCoresSessionRequestDto): Promise<CoresSessionResponseDto> {
    return CoresSessionResponseDto.de(await this.sessoes.iniciar(dados))
  }

  /** Histórico da pessoa, da sessão mais recente para a mais antiga. */
  @Get()
  async listar(@Query('participanteId') participanteId?: string, @Query('limite') limite?: string): Promise<CoresSessionResponseDto[]> {
    const sessoes = await this.sessoes.listar(participanteId ?? null, limite === undefined ? undefined : Number(limite))
    return sessoes.map((sessao) => CoresSessionResponseDto.de(sessao))
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Query('participanteId') participanteId?: string): Promise<CoresSessionResponseDto> {
    return CoresSessionResponseDto.de(await this.sessoes.obter(id, participanteId))
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async concluir(@Param('id') id: string, @Body() dados: FinishCoresSessionRequestDto): Promise<CoresSessionResponseDto> {
    return CoresSessionResponseDto.de(await this.sessoes.concluir(id, dados))
  }
}
