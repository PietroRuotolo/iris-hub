import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { CreateUserRequestDto } from '../dtos/request/create-user.request.dto.js'
import { SearchUsersRequestDto } from '../dtos/request/search-users.request.dto.js'
import { UsersService } from '../services/users.service.js'

@Controller('users')
export class UsersController {
  constructor(private readonly usuarios: UsersService) {}

  /** Rota só de criação de conta. */
  @Post()
  criar(@Body() dados: CreateUserRequestDto) {
    return this.usuarios.criar(dados)
  }

  /** Busca de jogadores pelo nome (para escolher quem vai jogar). */
  @Get()
  buscar(@Query() consulta: SearchUsersRequestDto) {
    return this.usuarios.buscar(consulta.busca, consulta.limite)
  }

  @Get(':id')
  obter(@Param('id') id: string) {
    return this.usuarios.obter(id)
  }

  @Post(':id/intro-seen')
  @HttpCode(HttpStatus.OK)
  marcarHistoriaVista(@Param('id') id: string) {
    return this.usuarios.marcarHistoriaVista(id)
  }
}
