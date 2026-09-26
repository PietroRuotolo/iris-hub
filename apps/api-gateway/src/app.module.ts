import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ModuloCompartilhado } from '@iris/shared'
import { ApiKeyGuard } from './core/guards/api-key.guard.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { CalibrationsModule } from './modules/calibrations/calibrations.module.js'

// Porta de entrada do front-end. Cada módulo expõe as rotas de uma área e as encaminha, pelos
// clients, ao serviço responsável; o gateway não tem regras de negócio nem banco.
@Module({
  imports: [ModuloCompartilhado.paraServico('api-gateway'), AuthModule, CalibrationsModule],
  // Toda requisição precisa do header x-api-key (exceto rotas @Publico(), como /health).
  providers: [{ provide: APP_GUARD, useClass: ApiKeyGuard }],
})
export class AppModule {}
