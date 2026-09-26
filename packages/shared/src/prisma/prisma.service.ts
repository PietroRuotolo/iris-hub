import { Global, Inject, Injectable, Module, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '../modulo/modulo-compartilhado.js'

/** Cliente do Prisma (MongoDB) com o endereço de MONGO_URI. Conecta ao iniciar e desconecta ao encerrar. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    if (!ambiente.mongoUri) {
      throw new Error('MONGO_URI não definida: coloque o endereço do MongoDB no .env da raiz (veja o .env.example)')
    }
    super({ datasourceUrl: ambiente.mongoUri })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}

/** Banco de dados para os serviços que usam MongoDB: `imports: [ModuloPrisma]` no AppModule. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class ModuloPrisma {}
