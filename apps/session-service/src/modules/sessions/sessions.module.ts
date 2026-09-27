import { Module } from '@nestjs/common'
import { SessionsController } from './controllers/sessions.controller.js'
import { SessionsRepository } from './repositories/sessions.repository.js'
import { SessionsService } from './services/sessions.service.js'

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository],
})
export class SessionsModule {}
