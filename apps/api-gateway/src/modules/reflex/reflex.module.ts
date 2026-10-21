import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module.js'
import { ReflexSessionsClient } from './clients/reflex-sessions.client.js'
import { ReflexSessionsController } from './controllers/reflex-sessions.controller.js'

@Module({
  imports: [UsersModule],
  controllers: [ReflexSessionsController],
  providers: [ReflexSessionsClient],
})
export class ReflexModule {}