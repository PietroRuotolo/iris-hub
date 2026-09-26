import { Injectable } from '@nestjs/common'
import type { Prisma, Session, User } from '@prisma/client'
import { PrismaService } from '@iris/shared'

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarUsuarioPorEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  buscarUsuarioPorId(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  criarUsuario(dados: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data: dados })
  }

  criarSessao(dados: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({ data: dados })
  }

  buscarSessaoValida(tokenHash: string, agora: Date): Promise<Session | null> {
    return this.prisma.session.findFirst({ where: { tokenHash, expiresAt: { gt: agora } } })
  }

  async revogarSessao(tokenHash: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { tokenHash } })
  }
}
