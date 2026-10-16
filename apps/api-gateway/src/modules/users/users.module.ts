import { Module } from '@nestjs/common'
import { UsersClient } from './clients/users.client.js'
import { UsersController } from './controllers/users.controller.js'

@Module({
  controllers: [UsersController],
  providers: [UsersClient],
  exports: [UsersClient],
})
export class UsersModule {}
