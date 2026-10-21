import { Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module.js'
import { ColorSessionsClient } from './clients/color-sessions.client.js'
import { ColorSessionsController } from './controllers/color-sessions.controller.js'

@Module({
  imports: [UsersModule],
  controllers: [ColorSessionsController],
  providers: [ColorSessionsClient],
})
export class ColorModule {}