import { Module } from '@nestjs/common'
import { EmailsModule } from '../emails/emails.module.js'
import { WhatsappModule } from '../whatsapp/whatsapp.module.js'
import { UsersClient } from './clients/users.client.js'
import { UsersController } from './controllers/users.controller.js'

@Module({
  // O cadastro manda as boas-vindas por e-mail e WhatsApp.
  imports: [EmailsModule, WhatsappModule],
  controllers: [UsersController],
  providers: [UsersClient],
  exports: [UsersClient],
})
export class UsersModule {}
