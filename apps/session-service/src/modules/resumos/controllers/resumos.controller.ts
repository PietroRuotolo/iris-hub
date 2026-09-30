import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CreateResumoRequestDto } from '../dtos/request/create-resumo.request.dto.js'
import type { ResumoCompartilhadoResponseDto, ResumoCriadoResponseDto } from '../dtos/response/resumo.response.dto.js'
import { ResumosService } from '../services/resumos.service.js'

/** Resumo compartilhado (QR code). O gateway preenche o participanteId e o nome a partir do login. */
@Controller('resumos')
export class ResumosController {
  constructor(private readonly resumos: ResumosService) {}

  @Post()
  criar(@Body() dados: CreateResumoRequestDto): Promise<ResumoCriadoResponseDto> {
    return this.resumos.criar(dados)
  }

  /** Sem login: quem tem o token (o celular que leu o QR code) vê o resumo. */
  @Get(':token')
  obter(@Param('token') token: string): Promise<ResumoCompartilhadoResponseDto> {
    return this.resumos.obter(token)
  }
}
