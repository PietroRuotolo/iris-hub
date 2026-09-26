import { Injectable } from '@nestjs/common'
import type { Calibracao, Prisma } from '@prisma/client'
import { PrismaService } from '@iris/shared'
import { ehObjectId } from '../../../core/utils/object-id.js'

@Injectable()
export class CalibrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(dados: Prisma.CalibracaoCreateInput): Promise<Calibracao> {
    return this.prisma.calibracao.create({ data: dados })
  }

  /** null se o id não existir (ou nem for um ObjectId válido). */
  async buscarPorId(id: string): Promise<Calibracao | null> {
    if (!ehObjectId(id)) return null
    return this.prisma.calibracao.findUnique({ where: { id } })
  }
}
