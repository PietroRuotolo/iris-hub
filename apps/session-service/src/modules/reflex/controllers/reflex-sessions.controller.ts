import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateReflexSessionRequestDto } from '../dtos/request/create-reflex-session.request.dto.js'
import { ReflexSessionResponseDto } from '../dtos/response/reflex-session.response.dto.js'
import { ReflexSessionsService } from '../services/reflex-sessions.service.js'

/** Partidas do jogo do reflexo. O playerId vem do gateway, que confere o jogador escolhido no site. */
@Controller('reflex-sessions')
export class ReflexSessionsController {
  constructor(private readonly partidas: ReflexSessionsService) {}

  /** Grava a partida (ou devolve a mesma, se esse id já foi gravado: o site pode repetir o envio). */
  @Post()
  async criar(@Body() dados: CreateReflexSessionRequestDto): Promise<ReflexSessionResponseDto> {
    return ReflexSessionResponseDto.de(await this.partidas.criar(dados))
  }

  /** As partidas do jogador, da mais recente para a mais antiga (20 por padrão, 100 no máximo). */
  @Get()
  async listar(@Query('playerId') playerId?: string, @Query('limite') limite?: string): Promise<ReflexSessionResponseDto[]> {
    if (!playerId) throw new BadRequestException('playerId é obrigatório')
    const partidas = await this.partidas.listar(playerId, limite === undefined ? undefined : Number(limite))
    return partidas.map((p) => ReflexSessionResponseDto.de(p))
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Query('playerId') playerId?: string): Promise<ReflexSessionResponseDto> {
    return ReflexSessionResponseDto.de(await this.partidas.obter(id, playerId))
  }
}