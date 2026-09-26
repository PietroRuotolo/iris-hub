import { Module } from '@nestjs/common'
import { ModuloCompartilhado, ModuloPrisma } from '@iris/shared'
import { AuthModule } from './modules/auth/auth.module.js'

@Module({
  imports: [ModuloCompartilhado.paraServico('user-service'), ModuloPrisma, AuthModule],
})
export class AppModule {}
