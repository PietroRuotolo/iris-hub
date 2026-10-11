import { Injectable } from '@nestjs/common'
import type { SessaoCores } from '@prisma/client'
import { resumirCores } from '@iris/contracts'
import { ConflitoException, DadosInvalidosException, NaoEncontradoException } from '@iris/shared'
import { normalizarLimite } from '../../../core/utils/limite.js'
import type { CreateCoresSessionRequestDto } from '../dtos/request/create-cores-session.request.dto.js'
import type { FinishCoresSessionRequestDto } from '../dtos/request/finish-cores-session.request.dto.js'
import { CoresSessionsRepository } from '../repositories/cores-sessions.repository.js'

@Injectable()
export class CoresSessionsService {
  constructor(private readonly repositorio: CoresSessionsRepository) {}

  iniciar(dados: CreateCoresSessionRequestDto): Promise<SessaoCores> {
    return this.repositorio.criar({ participanteId: dados.participanteId ?? null, status: 'EM_ANDAMENTO' })
  }

  /** As sessões de cores da pessoa, da mais recente para a mais antiga. */
  listar(participanteId: string | null, limite?: number): Promise<SessaoCores[]> {
    return this.repositorio.listarPorParticipante(participanteId ?? null, normalizarLimite(limite))
  }

  /** A sessão, se for dessa pessoa. De outra pessoa responde igual a inexistente (404). */
  async obter(id: string, participanteId?: string | null): Promise<SessaoCores> {
    const sessao = await this.repositorio.buscarPorId(id)
    if (!sessao || sessao.participanteId !== (participanteId ?? null)) {
      throw new NaoEncontradoException('Sessão de cores', id)
    }
    return sessao
  }

  /** Recalcula maior sequência e tempo médio a partir das rodadas (não confia nos números do site) e grava. */
  async concluir(id: string, dados: FinishCoresSessionRequestDto, agora = new Date()): Promise<SessaoCores> {
    const sessao = await this.obter(id, dados.participanteId)
    if (sessao.status !== 'EM_ANDAMENTO') throw new ConflitoException('A sessão já foi encerrada')

    const problemas: string[] = []
    if (dados.status === 'CONCLUIDA' && dados.rodadas.length === 0) {
      problemas.push('rodadas: uma sessão concluída precisa de ao menos uma rodada')
    }
    // As rodadas vêm em ordem, de 1 em 1: uma lacuna indica dado perdido ou adulterado.
    dados.rodadas.forEach((r, i) => {
      if (r.rodada !== i + 1) problemas.push(`rodadas.${i}.rodada: esperado ${i + 1}, veio ${r.rodada}`)
    })
    if (problemas.length > 0) throw new DadosInvalidosException(problemas)

    const rodadas = dados.rodadas.map((r) => ({
      rodada: r.rodada,
      tamanhoSequencia: r.tamanhoSequencia,
      acertou: r.acertou,
      tempoRespostaMs: r.tempoRespostaMs ?? null,
    }))
    const { maiorSequencia, tempoRespostaMedioMs } = resumirCores(rodadas)

    const gravou = await this.repositorio.concluir(id, {
      status: dados.status,
      concluidaEm: agora,
      pontuacaoFinal: dados.pontuacaoFinal ?? null,
      maiorSequencia,
      tempoRespostaMedioMs,
      rodadas,
    })
    if (!gravou) throw new ConflitoException('A sessão já foi encerrada')
    return this.obter(id, dados.participanteId)
  }
}
