import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module.js'
import { SessionsClient } from './clients/sessions.client.js'
import { SessionsController } from './controllers/sessions.controller.js'

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
  providers: [SessionsClient],
})
export class SessionsModule {}
