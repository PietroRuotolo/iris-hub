/**
 * @file reflex-sessions.controller.ts
 * @description Controller responsável por expor as rotas HTTP da funcionalidade do Jogo de Reflexo.
 * 
 * Responsabilidades:
 * - Rota POST /sessions/reflexo: Inicializa uma nova sessão de reflexo com status EM_ANDAMENTO.
 * - Rota GET /sessions/reflexo/:id: Consulta os dados e métricas de uma sessão existente pelo ID.
 * - Rota POST /sessions/reflexo/:id/finish: Finaliza a sessão, recebendo a lista de tentativas,
 *   calculando médias/melhor tempo e persistindo o resultado no banco.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ReflexSessionsService } from '../services/reflex-sessions.service.js'
import { CreateReflexSessionRequestDto } from '../dtos/request/create-reflex-session.request.dto.js'
import { FinishReflexSessionRequestDto } from '../dtos/request/finish-reflex-session.request.dto.js'
import { ReflexSessionResponseDto } from '../dtos/response/reflex-session.response.dto.js'

@Controller('sessions/reflexo')
export class ReflexSessionsController {
  constructor(private readonly reflexSessionsService: ReflexSessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async iniciar(
    @Body() dto: CreateReflexSessionRequestDto,
  ): Promise<ReflexSessionResponseDto> {
    return this.reflexSessionsService.iniciar(dto)
  }

  @Get(':id')
  async obterPorId(@Param('id') id: string): Promise<ReflexSessionResponseDto> {
    return this.reflexSessionsService.obterPorId(id)
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async concluir(
    @Param('id') id: string,
    @Body() dto: FinishReflexSessionRequestDto,
  ): Promise<ReflexSessionResponseDto> {
    return this.reflexSessionsService.concluir(id, dto)
  }
}