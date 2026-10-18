import { Module } from '@nestjs/common'
import { RhythmSessionsController } from './controllers/rhythm-sessions.controller.js'
import { RhythmSessionsRepository } from './repositories/rhythm-sessions.repository.js'
import { RhythmSessionsService } from './services/rhythm-sessions.service.js'

@Module({
  controllers: [RhythmSessionsController],
  providers: [RhythmSessionsService, RhythmSessionsRepository],
})
export class RhythmModule {}
