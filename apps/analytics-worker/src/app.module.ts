import { Module } from '@nestjs/common'
import { ModuloCompartilhado } from '@iris/shared'

// Sem HTTP. modules/summaries: consumers/ (fila sessao.concluida) e processors/ (cálculo do resumo).
@Module({
  imports: [ModuloCompartilhado.paraServico('analytics-worker', { http: false })],
})
export class AppModule {}
