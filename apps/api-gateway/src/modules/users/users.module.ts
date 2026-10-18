import { Module } from '@nestjs/common'
import { EmailsModule } from '../emails/emails.module.js'
import { UsersClient } from './clients/users.client.js'
import { UsersController } from './controllers/users.controller.js'

@Module({
  // O cadastro manda o e-mail de boas-vindas.
  imports: [EmailsModule],
  controllers: [UsersController],
  providers: [UsersClient],
  exports: [UsersClient],
})
export class UsersModule {}
