import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Request, Response } from 'express'
import type { Logger } from '@iris/logger'
import { DadosInvalidosException } from '../exceptions/excecoes.js'

export interface CorpoErro {
  status: number
  erro: string
  caminho: string
  detalhes?: string[]
}

/** Resposta de erro padronizada: { status, erro, caminho, detalhes? }. Erros 5xx são registrados no log. */
@Catch()
export class ErroHttpFilter implements ExceptionFilter {
  constructor(private readonly log: Logger) {}

  catch(excecao: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp()
    const requisicao = http.getRequest<Request>()
    const resposta = http.getResponse<Response>()

    const status = excecao instanceof HttpException ? excecao.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const corpo: CorpoErro = {
      status,
      erro: excecao instanceof HttpException ? excecao.message : 'Erro interno',
      caminho: requisicao.url,
    }
    if (excecao instanceof DadosInvalidosException) corpo.detalhes = excecao.detalhes

    if (status >= 500) {
      this.log.error('erro não tratado', { caminho: requisicao.url, detalhe: String(excecao) })
    }
    resposta.status(status).json(corpo)
  }
}
