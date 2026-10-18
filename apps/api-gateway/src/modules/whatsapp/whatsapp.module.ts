import { Module } from '@nestjs/common'
import { WhatsappClient } from './clients/whatsapp.client.js'
import { WhatsappGatewayController } from './controllers/whatsapp.controller.js'

@Module({ controllers: [WhatsappGatewayController], providers: [WhatsappClient], exports: [WhatsappClient] })
export class WhatsappModule {}
