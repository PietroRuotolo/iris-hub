import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateColorSessionRequestDto } from '../dtos/request/create-color-session.request.dto.js'
import { ColorSessionResponseDto } from '../dtos/response/color-session.response.dto.js'
import { ColorSessionsService } from '../services/color-sessions.service.js'

/** Partidas do jogo das cores. O playerId vem do gateway, que confere o jogador escolhido no site. */
@Controller('color-sessions')
export class ColorSessionsController {
  constructor(private readonly partidas: ColorSessionsService) {}

  /** Grava a partida (ou devolve a mesma, se esse id já foi gravado: o site pode repetir o envio). */
  @Post()
  async criar(@Body() dados: CreateColorSessionRequestDto): Promise<ColorSessionResponseDto> {
    return ColorSessionResponseDto.de(await this.partidas.criar(dados))
  }

  /** As partidas do jogador, da mais recente para a mais antiga (20 por padrão, 100 no máximo). */
  @Get()
  async listar(@Query('playerId') playerId?: string, @Query('limite') limite?: string): Promise<ColorSessionResponseDto[]> {
    if (!playerId) throw new BadRequestException('playerId é obrigatório')
    const partidas = await this.partidas.listar(playerId, limite === undefined ? undefined : Number(limite))
    return partidas.map((p) => ColorSessionResponseDto.de(p))
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Query('playerId') playerId?: string): Promise<ColorSessionResponseDto> {
    return ColorSessionResponseDto.de(await this.partidas.obter(id, playerId))
  }
}