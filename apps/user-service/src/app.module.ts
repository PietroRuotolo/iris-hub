import { Module } from '@nestjs/common'
import { ModuloCompartilhado } from '@iris/shared'

// Módulos: modules/users (participantes) e modules/auth (login, se houver). Ainda sem rotas.
@Module({
  imports: [ModuloCompartilhado.paraServico('user-service')],
})
export class AppModule {}
