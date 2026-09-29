/**
 * @file sessions.module.ts
 * @description Módulo NestJS responsável por agrupar e gerir as dependências
 * das sessões de testes psicomotores (sessões de alvos/fases e jogo de reflexo).
 * 
 * Responsabilidades:
 * - Registar os controllers HTTP (sessões padrão e jogo de reflexo).
 * - Fornecer os serviços de regra de negócio e o repositório Prisma para injeção de dependências.
 */

import { Module } from '@nestjs/common'
import { SessionsController } from './controllers/sessions.controller.js'
import { ReflexSessionsController } from './controllers/reflex-sessions.controller.js'
import { SessionsRepository } from './repositories/sessions.repository.js'
import { SessionsService } from './services/sessions.service.js'
import { ReflexSessionsService } from './services/reflex-sessions.service.js'

@Module({
  controllers: [
    SessionsController,
    ReflexSessionsController,
  ],
  providers: [
    SessionsService,
    ReflexSessionsService,
    SessionsRepository,
  ],
})
export class SessionsModule {}