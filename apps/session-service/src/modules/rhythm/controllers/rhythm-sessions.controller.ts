import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateRhythmSessionRequestDto } from '../dtos/request/create-rhythm-session.request.dto.js'
import { RhythmSessionResponseDto } from '../dtos/response/rhythm-session.response.dto.js'
import { RhythmSessionsService } from '../services/rhythm-sessions.service.js'

/** Partidas do jogo de ritmo. O playerId vem do gateway, que confere o jogador escolhido no site. */
@Controller('rhythm-sessions')
export class RhythmSessionsController {
  constructor(private readonly partidas: RhythmSessionsService) {}

  /** Grava a partida (ou devolve a mesma, se esse id já foi gravado: o site pode repetir o envio). */
  @Post()
  async criar(@Body() dados: CreateRhythmSessionRequestDto): Promise<RhythmSessionResponseDto> {
    return RhythmSessionResponseDto.de(await this.partidas.criar(dados))
  }

  /** As partidas do jogador, da mais recente para a mais antiga (20 por padrão, 100 no máximo). */
  @Get()
  async listar(@Query('playerId') playerId?: string, @Query('limite') limite?: string): Promise<RhythmSessionResponseDto[]> {
    if (!playerId) throw new BadRequestException('playerId é obrigatório')
    const partidas = await this.partidas.listar(playerId, limite === undefined ? undefined : Number(limite))
    return partidas.map((p) => RhythmSessionResponseDto.de(p))
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Query('playerId') playerId?: string): Promise<RhythmSessionResponseDto> {
    return RhythmSessionResponseDto.de(await this.partidas.obter(id, playerId))
  }
}
