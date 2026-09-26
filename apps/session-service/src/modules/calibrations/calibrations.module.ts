import { Module } from '@nestjs/common'
import { CalibrationsController } from './controllers/calibrations.controller.js'
import { CalibrationsRepository } from './repositories/calibrations.repository.js'
import { CalibrationsService } from './services/calibrations.service.js'

@Module({
  controllers: [CalibrationsController],
  providers: [CalibrationsService, CalibrationsRepository],
  exports: [CalibrationsService],
})
export class CalibrationsModule {}
