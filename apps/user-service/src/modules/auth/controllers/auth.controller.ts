import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { IdentifyUserRequestDto } from '../dtos/request/identify-user.request.dto.js'
import { RegisterUserRequestDto } from '../dtos/request/register-user.request.dto.js'
import { AuthService } from '../services/auth.service.js'

function tokenBearer(authorization?: string): string {
  const correspondencia = authorization?.match(/^Bearer\s+(.+)$/i)
  if (!correspondencia) throw new UnauthorizedException('Sessão ausente ou inválida')
  return correspondencia[1]
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  identificar(@Body() dados: IdentifyUserRequestDto) {
    return this.auth.identificar(dados.email)
  }

  @Post('register')
  cadastrar(@Body() dados: RegisterUserRequestDto) {
    return this.auth.cadastrar(dados.nome, dados.email)
  }

  @Get('me')
  async obterUsuario(@Headers('authorization') authorization?: string) {
    return { usuario: await this.auth.obterUsuario(tokenBearer(authorization)) }
  }

  @Post('me/intro-seen')
  @HttpCode(HttpStatus.OK)
  async marcarHistoriaVista(@Headers('authorization') authorization?: string) {
    return { usuario: await this.auth.marcarHistoriaVista(tokenBearer(authorization)) }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sair(@Headers('authorization') authorization?: string): Promise<void> {
    await this.auth.sair(tokenBearer(authorization))
  }
}
