import { Inject, Injectable } from '@nestjs/common'
import type { Ambiente } from '@iris/config'
import { AMBIENTE } from '@iris/shared'
import { encaminhar } from '../../../core/utils/encaminhar.js'

/** Os jogos com sessão própria além do ritmo (que tem o SessionsClient, com fases). */
export type JogoDeSessao = 'reflexo' | 'cores'

/**
 * Cliente HTTP do session-service para as sessões do reflexo e das cores, que têm o mesmo formato de
 * rotas (iniciar, listar, obter e encerrar). Só encaminha: validação e persistência ficam no serviço.
 */
@Injectable()
export class JogosSessionsClient {
  private readonly servico: { nome: string; url: string }

  constructor(@Inject(AMBIENTE) ambiente: Ambiente) {
    this.servico = { nome: 'session-service', url: ambiente.sessionServiceUrl }
  }

  iniciar(jogo: JogoDeSessao, corpo: unknown) {
    return encaminhar(this.servico, 'POST', `/sessions/${jogo}`, corpo)
  }

  listar(jogo: JogoDeSessao, participanteId: string) {
    const query = new URLSearchParams({ participanteId })
    return encaminhar(this.servico, 'GET', `/sessions/${jogo}?${query}`)
  }

  obter(jogo: JogoDeSessao, id: string, participanteId: string) {
    const query = new URLSearchParams({ participanteId })
    return encaminhar(this.servico, 'GET', `/sessions/${jogo}/${encodeURIComponent(id)}?${query}`)
  }

  encerrar(jogo: JogoDeSessao, id: string, corpo: unknown) {
    return encaminhar(this.servico, 'POST', `/sessions/${jogo}/${encodeURIComponent(id)}/finish`, corpo)
  }
}
