import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { JogosSessionsClient } from './clients/jogos-sessions.client.js'
import { SessionsClient } from './clients/sessions.client.js'
import { CoresSessionsController } from './controllers/cores-sessions.controller.js'
import { ReflexoSessionsController } from './controllers/reflexo-sessions.controller.js'
import { SessionsController } from './controllers/sessions.controller.js'
import { ParticipanteService } from './participante.service.js'

// A ORDEM DOS CONTROLLERS IMPORTA: `sessions/reflexo` e `sessions/cores` vêm antes de `sessions`,
// senão `GET /sessions/reflexo` cairia em `GET /sessions/:id` (id = "reflexo").
@Module({
  imports: [AuthModule],
  controllers: [ReflexoSessionsController, CoresSessionsController, SessionsController],
  providers: [SessionsClient, JogosSessionsClient, ParticipanteService],
})
export class SessionsModule {}
