import { Module } from '@nestjs/common'
import { CalibrationsModule } from '../calibrations/calibrations.module.js'
import { SessionsController } from './controllers/sessions.controller.js'
import { SessionsRepository } from './repositories/sessions.repository.js'
import { SessionsService } from './services/sessions.service.js'

@Module({
  imports: [CalibrationsModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository],
})
export class SessionsModule {}
