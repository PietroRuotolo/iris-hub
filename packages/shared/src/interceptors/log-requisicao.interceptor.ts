import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { Request, Response } from 'express'
import type { Logger } from '@iris/logger'

/** Registra cada requisição HTTP ao terminar: método, caminho, status e duração. */
@Injectable()
export class LogRequisicaoInterceptor implements NestInterceptor {
  constructor(private readonly log: Logger) {}

  intercept(contexto: ExecutionContext, proximo: CallHandler) {
    if (contexto.getType() !== 'http') return proximo.handle()

    const http = contexto.switchToHttp()
    const requisicao = http.getRequest<Request>()
    const resposta = http.getResponse<Response>()
    const inicio = performance.now()

    // "finish" dispara também quando a resposta vem do filtro de erros.
    resposta.once('finish', () => {
      this.log.info('requisição', {
        metodo: requisicao.method,
        caminho: requisicao.originalUrl,
        status: resposta.statusCode,
        duracaoMs: Math.round(performance.now() - inicio),
      })
    })
    return proximo.handle()
  }
}
