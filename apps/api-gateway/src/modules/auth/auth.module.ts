import { Module } from '@nestjs/common'
import { AuthClient } from './clients/auth.client.js'
import { AuthGatewayController } from './controllers/auth.controller.js'

@Module({
  controllers: [AuthGatewayController],
  providers: [AuthClient],
})
export class AuthModule {}
