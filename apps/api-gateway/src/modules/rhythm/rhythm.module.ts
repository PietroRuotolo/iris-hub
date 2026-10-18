import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module.js'
import { RhythmSessionsClient } from './clients/rhythm-sessions.client.js'
import { RhythmSessionsController } from './controllers/rhythm-sessions.controller.js'

@Module({
  imports: [UsersModule],
  controllers: [RhythmSessionsController],
  providers: [RhythmSessionsClient],
})
export class RhythmModule {}
