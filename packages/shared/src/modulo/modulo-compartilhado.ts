import { Global, Module, type DynamicModule, type Provider } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { lerAmbiente } from '@iris/config'
import { criarLogger, type Logger } from '@iris/logger'
import { ErroHttpFilter } from '../filters/erro-http.filter.js'
import { criarHealthController } from '../health/health.controller.js'
import { LogRequisicaoInterceptor } from '../interceptors/log-requisicao.interceptor.js'
import { criarPipeValidacao } from '../pipes/validacao.js'

/** Tokens de injeção: `@Inject(AMBIENTE) ambiente: Ambiente` e `@Inject(LOGGER) log: Logger`. */
export const AMBIENTE = Symbol('AMBIENTE')
export const LOGGER = Symbol('LOGGER')

/**
 * Módulo comum a todos os serviços: ambiente e logger injetáveis e, nos serviços HTTP, filtro de
 * erros, log de requisições, validação dos DTOs e GET /health, registrados de forma global.
 *
 * Uso no AppModule: `imports: [ModuloCompartilhado.paraServico('session-service')]`.
 */
@Global()
@Module({})
export class ModuloCompartilhado {
  static paraServico(servico: string, { http = true }: { http?: boolean } = {}): DynamicModule {
    const ambiente = lerAmbiente()
    const log = criarLogger(servico, { nivelMinimo: ambiente.logLevel })

    const providers: Provider[] = [
      { provide: AMBIENTE, useValue: ambiente },
      { provide: LOGGER, useValue: log },
    ]
    if (http) {
      providers.push(
        { provide: APP_FILTER, useFactory: (logger: Logger) => new ErroHttpFilter(logger), inject: [LOGGER] },
        { provide: APP_INTERCEPTOR, useFactory: (logger: Logger) => new LogRequisicaoInterceptor(logger), inject: [LOGGER] },
        { provide: APP_PIPE, useFactory: criarPipeValidacao },
      )
    }

    return {
      module: ModuloCompartilhado,
      controllers: http ? [criarHealthController(servico)] : [],
      providers,
      exports: [AMBIENTE, LOGGER],
    }
  }
}
