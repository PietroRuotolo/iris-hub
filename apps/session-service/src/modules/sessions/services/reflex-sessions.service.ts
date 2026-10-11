import { Injectable } from '@nestjs/common'
import type { SessaoReflexo } from '@prisma/client'
import { resumirReflexo } from '@iris/contracts'
import { ConflitoException, DadosInvalidosException, NaoEncontradoException } from '@iris/shared'
import type { CreateReflexSessionRequestDto } from '../dtos/request/create-reflex-session.request.dto.js'
import type { FinishReflexSessionRequestDto, TentativaReflexoDto } from '../dtos/request/finish-reflex-session.request.dto.js'
import { normalizarLimite } from '../../../core/utils/limite.js'
import { SessionsRepository } from '../repositories/sessions.repository.js'

/** O que cada campo da tentativa precisa respeitar além do formato (o DTO cuida do formato). */
function problemasDaTentativa(t: TentativaReflexoDto, indice: number): string[] {
  const problemas: string[] = []
  const temReacao = typeof t.tempoReacaoMs === 'number'
  if (t.queimou && temReacao) problemas.push(`tentativas.${indice}.tempoReacaoMs: quem queimou a largada não tem tempo de reação`)
  if (!t.queimou && !temReacao) problemas.push(`tentativas.${indice}.tempoReacaoMs: obrigatório quando não queimou a largada`)
  return problemas
}

@Injectable()
export class ReflexSessionsService {
  constructor(private readonly repositorio: SessionsRepository) {}

  iniciar(dados: CreateReflexSessionRequestDto): Promise<SessaoReflexo> {
    return this.repositorio.criarSessaoReflexo({ participanteId: dados.participanteId ?? null, status: 'EM_ANDAMENTO' })
  }

  /** As sessões de reflexo da pessoa, da mais recente para a mais antiga. */
  listar(participanteId: string | null, limite?: number): Promise<SessaoReflexo[]> {
    return this.repositorio.listarSessoesReflexoPorParticipante(participanteId ?? null, normalizarLimite(limite))
  }

  /** A sessão, se for dessa pessoa. De outra pessoa responde igual a inexistente (404). */
  async obter(id: string, participanteId?: string | null): Promise<SessaoReflexo> {
    const sessao = await this.repositorio.buscarSessaoReflexoPorId(id)
    if (!sessao || sessao.participanteId !== (participanteId ?? null)) {
      throw new NaoEncontradoException('Sessão de reflexo', id)
    }
    return sessao
  }

  /** Recalcula média e melhor tempo a partir das tentativas (não confia nos números do site) e grava. */
  async concluir(id: string, dados: FinishReflexSessionRequestDto, agora = new Date()): Promise<SessaoReflexo> {
    const sessao = await this.obter(id, dados.participanteId)
    if (sessao.status !== 'EM_ANDAMENTO') throw new ConflitoException('A sessão já foi encerrada')

    const problemas = dados.tentativas.flatMap(problemasDaTentativa)
    if (dados.status === 'CONCLUIDA' && dados.tentativas.length === 0) {
      problemas.push('tentativas: uma sessão concluída precisa de ao menos uma tentativa')
    }
    if (problemas.length > 0) throw new DadosInvalidosException(problemas)

    const tentativas = dados.tentativas.map((t) => ({
      rodada: t.rodada,
      tempoEsperaMs: t.tempoEsperaMs,
      tempoReacaoMs: t.queimou ? null : (t.tempoReacaoMs ?? null),
      queimou: t.queimou,
      acionamento: t.acionamento,
    }))
    const { tempoMedioMs, melhorTempoMs } = resumirReflexo(tentativas)

    const gravou = await this.repositorio.concluirSessaoReflexo(id, {
      status: dados.status,
      concluidaEm: agora,
      tempoMedioMs,
      melhorTempoMs,
      tentativas,
    })
    if (!gravou) throw new ConflitoException('A sessão já foi encerrada')
    return this.obter(id, dados.participanteId)
  }
}
