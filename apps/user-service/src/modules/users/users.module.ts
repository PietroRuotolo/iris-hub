import { Module } from '@nestjs/common'
import { UsersController } from './controllers/users.controller.js'
import { UsersRepository } from './repositories/users.repository.js'
import { UsersService } from './services/users.service.js'

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
