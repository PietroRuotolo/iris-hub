import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ModuloCompartilhado } from '@iris/shared'
import { ApiKeyGuard } from './core/guards/api-key.guard.js'
import { CalibrationsModule } from './modules/calibrations/calibrations.module.js'
import { EmailsModule } from './modules/emails/emails.module.js'
import { ResumosModule } from './modules/resumos/resumos.module.js'
import { SessionsModule } from './modules/sessions/sessions.module.js'
import { UsersModule } from './modules/users/users.module.js'

// Porta de entrada do front-end. Cada módulo expõe as rotas de uma área e as encaminha, pelos
// clients, ao serviço responsável; o gateway não tem regras de negócio nem banco.
@Module({
  imports: [ModuloCompartilhado.paraServico('api-gateway'), UsersModule, CalibrationsModule, EmailsModule, SessionsModule, ResumosModule],
  // Toda requisição precisa do header x-api-key (exceto rotas @Publico(), como /health).
  providers: [{ provide: APP_GUARD, useClass: ApiKeyGuard }],
})
export class AppModule {}
