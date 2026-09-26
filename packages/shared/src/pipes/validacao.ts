import { ValidationPipe, type ValidationError } from '@nestjs/common'
import { DadosInvalidosException } from '../exceptions/excecoes.js'

/** Achata os erros do class-validator em "campo: mensagem" (campos aninhados com ponto). */
export function formatarErrosValidacao(erros: ValidationError[], prefixo = ''): string[] {
  return erros.flatMap((erro) => {
    const campo = prefixo ? `${prefixo}.${erro.property}` : erro.property
    const proprios = Object.values(erro.constraints ?? {}).map((mensagem) => `${campo}: ${mensagem}`)
    return [...proprios, ...formatarErrosValidacao(erro.children ?? [], campo)]
  })
}

/** Valida e converte os DTOs de entrada; campos fora do DTO são rejeitados. */
export function criarPipeValidacao() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (erros) => new DadosInvalidosException(formatarErrosValidacao(erros)),
  })
}
