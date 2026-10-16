import { Module } from '@nestjs/common'
import { ModuloCompartilhado } from '@iris/shared'

// Sem módulos por enquanto: as tabelas de partidas (sessões, tentativas, resumos) saíram para a
// reorganização do banco. O serviço segue no ar, só com GET /health.
@Module({
  imports: [ModuloCompartilhado.paraServico('session-service')],
})
export class AppModule {}
