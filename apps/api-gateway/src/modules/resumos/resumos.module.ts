import { Module } from '@nestjs/common'
import { SessionsModule } from '../sessions/sessions.module.js'
import { ResumosClient } from './clients/resumos.client.js'
import { ResumosController } from './controllers/resumos.controller.js'

@Module({
  imports: [SessionsModule],
  controllers: [ResumosController],
  providers: [ResumosClient],
})
export class ResumosModule {}
