import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'

/** 404: recurso inexistente (ex.: new NaoEncontradoException('Sessão', id) → "Não encontrado: Sessão <id>"). */
export class NaoEncontradoException extends NotFoundException {
  constructor(recurso: string, id: string) {
    super(`Não encontrado: ${recurso} ${id}`)
  }
}

/** 409: a operação conflita com o estado atual (ex.: finalizar uma sessão já concluída). */
export class ConflitoException extends ConflictException {}

/** 400: corpo da requisição inválido, com a lista do que está errado em `detalhes`. */
export class DadosInvalidosException extends BadRequestException {
  constructor(readonly detalhes: string[]) {
    super('Dados inválidos')
  }
}
