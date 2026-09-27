import { Module } from '@nestjs/common'
import { EmailsClient } from './clients/emails.client.js'
import { EmailsGatewayController } from './controllers/emails.controller.js'

@Module({ controllers: [EmailsGatewayController], providers: [EmailsClient], exports: [EmailsClient] })
export class EmailsModule {}
