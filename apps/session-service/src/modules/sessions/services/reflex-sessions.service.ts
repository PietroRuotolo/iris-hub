import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { SessionsRepository } from '../repositories/sessions.repository.js'
import { CreateReflexSessionRequestDto } from '../dtos/request/create-reflex-session.request.dto.js'
import { FinishReflexSessionRequestDto } from '../dtos/request/finish-reflex-session.request.dto.js'
import { ReflexSessionResponseDto } from '../dtos/response/reflex-session.response.dto.js'

@Injectable()
export class ReflexSessionsService {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async iniciar(dto: CreateReflexSessionRequestDto): Promise<ReflexSessionResponseDto> {
    const sessao = await this.sessionsRepository.criarSessaoReflexo({
      participanteId: dto.participanteId,
      status: 'EM_ANDAMENTO',
    })

    return this.mapearParaResponse(sessao)
  }

  async obterPorId(id: string): Promise<ReflexSessionResponseDto> {
    const sessao = await this.sessionsRepository.buscarSessaoReflexoPorId(id)
    if (!sessao) {
      throw new NotFoundException(`Sessão de reflexo com id '${id}' não encontrada.`)
    }
    return this.mapearParaResponse(sessao)
  }

  async concluir(id: string, dto: FinishReflexSessionRequestDto): Promise<ReflexSessionResponseDto> {
    const sessao = await this.sessionsRepository.buscarSessaoReflexoPorId(id)
    if (!sessao) {
      throw new NotFoundException(`Sessão de reflexo com id '${id}' não encontrada.`)
    }

    if (sessao.status !== 'EM_ANDAMENTO') {
      throw new BadRequestException('A sessão já se encontra finalizada.')
    }

    // Filtra apenas as tentativas válidas para o cálculo de métricas
    const tentativasValidas = dto.tentativas.filter(
      (t) => !t.queimou && typeof t.tempoReacaoMs === 'number',
    )

    let tempoMedioMs: number | null = null
    let melhorTempoMs: number | null = null

    if (tentativasValidas.length > 0) {
      const tempos = tentativasValidas.map((t) => t.tempoReacaoMs!)
      melhorTempoMs = Math.min(...tempos)
      const soma = tempos.reduce((acc, val) => acc + val, 0)
      tempoMedioMs = Math.round((soma / tempos.length) * 100) / 100
    }

    const atualizada = await this.sessionsRepository.concluirSessaoReflexo(id, {
      status: dto.status,
      concluidaEm: new Date(),
      tempoMedioMs,
      melhorTempoMs,
      tentativas: dto.tentativas.map((t) => ({
        rodada: t.rodada,
        tempoEsperaMs: t.tempoEsperaMs,
        tempoReacaoMs: t.tempoReacaoMs ?? null,
        queimou: t.queimou,
        acionamento: t.acionamento,
      })),
    })

    if (!atualizada) {
      throw new BadRequestException('Não foi possível concluir a sessão de reflexo.')
    }

    return this.obterPorId(id)
  }

  private mapearParaResponse(sessao: any): ReflexSessionResponseDto {
    return {
      id: sessao.id,
      participanteId: sessao.participanteId ?? null,
      iniciadaEm: sessao.iniciadaEm,
      concluidaEm: sessao.concluidaEm ?? null,
      status: sessao.status,
      tempoMedioMs: sessao.tempoMedioMs ?? null,
      melhorTempoMs: sessao.melhorTempoMs ?? null,
      tentativas: sessao.tentativas ?? [],
    }
  }
}