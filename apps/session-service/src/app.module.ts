import { Module } from '@nestjs/common'
import { ModuloCompartilhado, ModuloPrisma } from '@iris/shared'
import { CalibrationsModule } from './modules/calibrations/calibrations.module.js'

@Module({
  imports: [ModuloCompartilhado.paraServico('session-service'), ModuloPrisma, CalibrationsModule],
})
export class AppModule {}
