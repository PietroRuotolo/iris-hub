import { Module } from '@nestjs/common'
import { WhatsappController } from './controllers/whatsapp.controller.js'
import { EvolutionClient } from './services/evolution.client.js'
import { WhatsappService } from './services/whatsapp.service.js'

/** Mensagens de WhatsApp (texto ou imagem) pela Evolution API. Mora no email-service: os dois só mandam mensagens. */
@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, EvolutionClient],
})
export class WhatsappModule {}
