import { Module } from '@nestjs/common'
import { ModuloCompartilhado } from '@iris/shared'

// Sem HTTP; estrutura reservada para futuros consumidores e processadores assíncronos.
@Module({
  imports: [ModuloCompartilhado.paraServico('analytics-worker', { http: false })],
})
export class AppModule {}
