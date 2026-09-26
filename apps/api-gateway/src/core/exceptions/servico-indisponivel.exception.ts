import { BadGatewayException } from '@nestjs/common'

/** 502: o serviço de destino não respondeu (fora do ar ou inacessível). */
export class ServicoIndisponivelException extends BadGatewayException {
  constructor(servico: string) {
    super(`${servico} indisponível`)
  }
}
