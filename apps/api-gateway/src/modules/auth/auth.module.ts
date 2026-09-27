import { Module } from '@nestjs/common'
import { EmailsModule } from '../emails/emails.module.js'
import { AuthClient } from './clients/auth.client.js'
import { AuthGatewayController } from './controllers/auth.controller.js'

@Module({
  imports: [EmailsModule],
  controllers: [AuthGatewayController],
  providers: [AuthClient],
})
export class AuthModule {}
