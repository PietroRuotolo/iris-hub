import { Controller, Get, Headers, Param, Post, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { ParticipanteService } from '../../sessions/participante.service.js'
import { ResumosClient } from '../clients/resumos.client.js'

/**
 * Resumo compartilhado (QR code). Criar exige login: o dono e o nome vêm do token, nunca do corpo.
 * Abrir pelo token não exige login (é o celular que leu o QR code), só a x-api-key, que o servidor
 * do site adiciona.
 */
@Controller('resumos')
export class ResumosController {
  constructor(
    private readonly resumos: ResumosClient,
    private readonly participante: ParticipanteService,
  ) {}

  @Post()
  async criar(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) res: Response) {
    const { id, nome } = await this.participante.pessoaDoLogin(authorization)
    return repassar(await this.resumos.criar(id, nome), res)
  }

  @Get(':token')
  async obter(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.resumos.obter(token), res)
  }
}
