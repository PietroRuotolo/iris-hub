import { Module } from '@nestjs/common'
import { CalibrationsClient } from './clients/calibrations.client.js'
import { CalibrationsController } from './controllers/calibrations.controller.js'

@Module({
  controllers: [CalibrationsController],
  providers: [CalibrationsClient],
})
export class CalibrationsModule {}
