import { Module } from '@nestjs/common'
import { ReflexSessionsController } from './controllers/reflex-sessions.controller.js'
import { ReflexSessionsRepository } from './repositories/reflex-sessions.repository.js'
import { ReflexSessionsService } from './services/reflex-sessions.service.js'

@Module({
  controllers: [ReflexSessionsController],
  providers: [ReflexSessionsService, ReflexSessionsRepository],
})
export class ReflexModule {}