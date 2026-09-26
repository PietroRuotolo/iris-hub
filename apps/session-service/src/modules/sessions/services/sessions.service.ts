import { Injectable } from '@nestjs/common'
import type { Sessao } from '@prisma/client'
import type { ResumoSessao } from '@iris/contracts'
import { ConflitoException, NaoEncontradoException } from '@iris/shared'
import { CalibrationsService } from '../../calibrations/services/calibrations.service.js'
import type { CreateSessionRequestDto } from '../dtos/request/create-session.request.dto.js'
import type { FinishSessionRequestDto } from '../dtos/request/finish-session.request.dto.js'
import { SessionsRepository } from '../repositories/sessions.repository.js'
import { calcularResumo } from './calcular-resumo.js'

@Injectable()
export class SessionsService {
  constructor(
    private readonly repositorio: SessionsRepository,
    private readonly calibracoes: CalibrationsService,
  ) {}

  /** Inicia uma sessão; a calibração precisa existir (404 se não existir). */
  async iniciar(dados: CreateSessionRequestDto, agora = new Date()): Promise<Sessao> {
    await this.calibracoes.obter(dados.calibracaoId)
    return this.repositorio.criar({
      participanteId: dados.participanteId ?? null,
      calibracaoId: dados.calibracaoId,
      iniciadaEm: agora,
      concluidaEm: null,
      status: 'em-andamento',
      eventos: [],
      resumo: null,
    })
  }

  async obter(id: string): Promise<Sessao> {
    const sessao = await this.repositorio.buscarPorId(id)
    if (!sessao) throw new NaoEncontradoException('Sessão', id)
    return sessao
  }

  /** Encerra a sessão com os eventos do jogo e calcula o resumo. Só vale para sessões em andamento (409). */
  async finalizar(id: string, dados: FinishSessionRequestDto, agora = new Date()): Promise<Sessao> {
    const sessao = await this.obter(id)
    if (sessao.status !== 'em-andamento') {
      throw new ConflitoException(`Sessão ${id} já está ${sessao.status}`)
    }
    const eventos = dados.eventos.map((evento) => ({ ...evento }))
    const concluida = await this.repositorio.concluir(id, { concluidaEm: agora, eventos, resumo: calcularResumo(eventos) })
    if (!concluida) throw new ConflitoException(`Sessão ${id} já foi finalizada`)
    return concluida
  }

  /** Resumo de uma sessão concluída (409 se ela ainda não terminou). */
  async obterResumo(id: string): Promise<Omit<ResumoSessao, 'sessaoId'>> {
    const sessao = await this.obter(id)
    if (!sessao.resumo) throw new ConflitoException(`Sessão ${id} ainda não foi finalizada`)
    return sessao.resumo
  }
}
