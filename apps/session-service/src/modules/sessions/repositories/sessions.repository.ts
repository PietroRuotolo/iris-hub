import { Injectable } from '@nestjs/common'
import type { Prisma, Sessao } from '@prisma/client'
import { PrismaService } from '@iris/shared'
import { ehObjectId } from '../../../core/utils/object-id.js'

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(dados: Prisma.SessaoCreateInput): Promise<Sessao> {
    return this.prisma.sessao.create({ data: dados })
  }

  /** null se o id não existir (ou nem for um ObjectId válido). */
  async buscarPorId(id: string): Promise<Sessao | null> {
    if (!ehObjectId(id)) return null
    return this.prisma.sessao.findUnique({ where: { id } })
  }

  /** Sessões da pessoa, da mais recente para a mais antiga (índice participanteId + iniciadaEm). */
  listarPorParticipante(participanteId: string | null, limite: number): Promise<Sessao[]> {
    return this.prisma.sessao.findMany({
      where: { participanteId },
      orderBy: { iniciadaEm: 'desc' },
      take: limite,
    })
  }

  /**
   * Grava uma fase numa transação: só atualiza se a sessão ainda estiver em andamento e sem essa
   * fase (duas requisições iguais ao mesmo tempo não gravam a fase duas vezes). false se não gravou.
   */
  async registrarFase(
    id: string,
    fase: Prisma.FaseResumoCreateInput,
    totais: { pontuacaoTotal: number | null; coberturaTotal: number | null },
    tentativas: Prisma.TentativaAlvoCreateManyInput[],
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.sessao.updateMany({
        where: { id, status: 'EM_ANDAMENTO', fases: { none: { fase: fase.fase } } },
        data: { fases: { push: fase }, ...totais },
      })
      if (count === 0) return false
      await tx.tentativaAlvo.createMany({ data: tentativas })
      return true
    })
  }

  /** Fecha a sessão só se ela ainda estiver em andamento. false se não fechou. */
  async concluir(id: string, status: 'CONCLUIDA' | 'CANCELADA', concluidaEm: Date): Promise<boolean> {
    const { count } = await this.prisma.sessao.updateMany({
      where: { id, status: 'EM_ANDAMENTO' },
      data: { status, concluidaEm },
    })
    return count > 0
  }

  // --- JOGO DE REFLEXO ---

  /** Cria uma nova sessão para o teste de reflexo */
  criarSessaoReflexo(dados: Prisma.SessaoReflexoCreateInput) {
    return this.prisma.sessaoReflexo.create({ data: dados })
  }

  /** Procura uma sessão de reflexo pelo ID */
  async buscarSessaoReflexoPorId(id: string) {
    if (!ehObjectId(id)) return null
    return this.prisma.sessaoReflexo.findUnique({ where: { id } })
  }

  /** Sessões de reflexo da pessoa, da mais recente para a mais antiga (índice participanteId + iniciadaEm). */
  listarSessoesReflexoPorParticipante(participanteId: string | null, limite: number) {
    return this.prisma.sessaoReflexo.findMany({
      where: { participanteId },
      orderBy: { iniciadaEm: 'desc' },
      take: limite,
    })
  }

  /** Conclui a sessão de reflexo com os tempos e tentativas */
  async concluirSessaoReflexo(
    id: string,
    dados: {
      status: 'CONCLUIDA' | 'CANCELADA'
      concluidaEm: Date
      tempoMedioMs?: number | null
      melhorTempoMs?: number | null
      tentativas: Prisma.TentativaReflexoCreateInput[]
    },
  ): Promise<boolean> {
    const { count } = await this.prisma.sessaoReflexo.updateMany({
      where: { id, status: 'EM_ANDAMENTO' },
      data: {
        status: dados.status,
        concluidaEm: dados.concluidaEm,
        tempoMedioMs: dados.tempoMedioMs,
        melhorTempoMs: dados.melhorTempoMs,
        tentativas: { set: dados.tentativas },
      },
    })
    return count > 0
  }
}
