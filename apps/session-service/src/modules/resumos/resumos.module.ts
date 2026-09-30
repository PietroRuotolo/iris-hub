import { Module } from '@nestjs/common'
import { ResumosController } from './controllers/resumos.controller.js'
import { ResumosRepository } from './repositories/resumos.repository.js'
import { ResumosService } from './services/resumos.service.js'

@Module({
  controllers: [ResumosController],
  providers: [ResumosService, ResumosRepository],
})
export class ResumosModule {}
