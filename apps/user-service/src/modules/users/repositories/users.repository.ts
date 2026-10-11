import { Injectable } from '@nestjs/common'
import type { Prisma, User } from '@prisma/client'
import { PrismaService } from '@iris/shared'

/** Documento cru do MongoDB (findRaw), só com os campos usados na busca. */
interface UserCru {
  _id: string
  nome: string
  email: string
  historiaVistaEm?: { $date: string } | null
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(dados: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data: dados })
  }

  buscarPorId(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  /** Pelo nome, com uma expressão regular já pronta (sem diferenciar maiúsculas e acentos). */
  async buscarPorNome(regex: string, limite: number): Promise<Pick<User, 'id' | 'nome' | 'email' | 'historiaVistaEm'>[]> {
    const crus = (await this.prisma.user.findRaw({
      filter: { nome: { $regex: regex, $options: 'i' } },
      options: { projection: { nome: 1, email: 1, historiaVistaEm: 1 }, sort: { nome: 1 }, limit: limite },
    })) as unknown as UserCru[]
    return crus.map((u) => ({
      id: u._id,
      nome: u.nome,
      email: u.email,
      historiaVistaEm: u.historiaVistaEm ? new Date(u.historiaVistaEm.$date) : null,
    }))
  }

  marcarHistoriaVista(id: string, quando: Date): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { historiaVistaEm: quando } })
  }
}
