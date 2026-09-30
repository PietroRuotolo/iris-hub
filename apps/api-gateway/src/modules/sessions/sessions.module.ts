import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { JogosSessionsClient } from './clients/jogos-sessions.client.js'
import { SessionsClient } from './clients/sessions.client.js'
import { CoresSessionsController, ReflexoSessionsController } from './controllers/jogo-sessions.controller.js'
import { SessionsController } from './controllers/sessions.controller.js'
import { ParticipanteService } from './participante.service.js'

// A ORDEM DOS CONTROLLERS IMPORTA: `sessions/reflexo` e `sessions/cores` vêm antes de `sessions`,
// senão `GET /sessions/reflexo` cairia em `GET /sessions/:id` (id = "reflexo").
// Jogo novo com as rotas simples: `criarControllerSessoesJogo('<jogo>')` aqui, antes do SessionsController.
@Module({
  imports: [AuthModule],
  controllers: [ReflexoSessionsController, CoresSessionsController, SessionsController],
  providers: [SessionsClient, JogosSessionsClient, ParticipanteService],
  exports: [ParticipanteService],
})
export class SessionsModule {}
