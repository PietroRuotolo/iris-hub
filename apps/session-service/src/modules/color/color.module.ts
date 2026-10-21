import { Module } from '@nestjs/common'
import { ColorSessionsController } from './controllers/color-sessions.controller.js'
import { ColorSessionsRepository } from './repositories/color-sessions.repository.js'
import { ColorSessionsService } from './services/color-sessions.service.js'

@Module({
  controllers: [ColorSessionsController],
  providers: [ColorSessionsService, ColorSessionsRepository],
})
export class ColorModule {}