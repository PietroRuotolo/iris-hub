/**
 * Módulo das sessões de jogo: ritmo (fases e alvos), reflexo e cores.
 *
 * A ORDEM DOS CONTROLLERS IMPORTA: `sessions/reflexo` e `sessions/cores` vêm antes de `sessions`,
 * senão `GET /sessions/reflexo` e `GET /sessions/cores` cairiam em `GET /sessions/:id` (id = "reflexo").
 */

import { Module } from '@nestjs/common'
import { CoresSessionsController } from './controllers/cores-sessions.controller.js'
import { ReflexSessionsController } from './controllers/reflex-sessions.controller.js'
import { SessionsController } from './controllers/sessions.controller.js'
import { CoresSessionsRepository } from './repositories/cores-sessions.repository.js'
import { SessionsRepository } from './repositories/sessions.repository.js'
import { CoresSessionsService } from './services/cores-sessions.service.js'
import { ReflexSessionsService } from './services/reflex-sessions.service.js'
import { SessionsService } from './services/sessions.service.js'

@Module({
  controllers: [ReflexSessionsController, CoresSessionsController, SessionsController],
  providers: [SessionsService, ReflexSessionsService, CoresSessionsService, SessionsRepository, CoresSessionsRepository],
})
export class SessionsModule {}
