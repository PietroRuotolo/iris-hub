import { Module } from '@nestjs/common'
import { SessionsClient } from './clients/sessions.client.js'
import { SessionsController } from './controllers/sessions.controller.js'

@Module({
  controllers: [SessionsController],
  providers: [SessionsClient],
})
export class SessionsModule {}
