import { Module } from '@nestjs/common'
import { ModuloCompartilhado, ModuloPrisma } from '@iris/shared'
import { UsersModule } from './modules/users/users.module.js'

@Module({
  imports: [ModuloCompartilhado.paraServico('user-service'), ModuloPrisma, UsersModule],
})
export class AppModule {}
