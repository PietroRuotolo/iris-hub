import { Controller, Get } from '@nestjs/common'
import { Publico } from '../decorators/publico.js'

/** GET /health de um serviço: { status: 'ok', servico }. Público (não exige x-api-key). */
export function criarHealthController(servico: string) {
  @Publico()
  @Controller('health')
  class HealthController {
    @Get()
    verificar() {
      return { status: 'ok', servico }
    }
  }
  return HealthController
}
