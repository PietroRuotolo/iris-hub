import { Module } from '@nestjs/common'
import { EmailController } from './controllers/email.controller.js'
import { EmailService } from './services/email.service.js'
import { MicrosoftGraphClient } from './services/microsoft-graph.client.js'

@Module({
  controllers: [EmailController],
  providers: [EmailService, MicrosoftGraphClient],
})
export class EmailsModule {}
