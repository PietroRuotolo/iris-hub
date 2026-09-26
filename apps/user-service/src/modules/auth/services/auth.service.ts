import { createHash, randomBytes } from 'node:crypto'
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { User } from '@prisma/client'
import { AuthRepository } from '../repositories/auth.repository.js'

const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000

export interface UsuarioAutenticado {
  id: string
  nome: string
  email: string
}

export interface ResultadoAutenticacao {
  usuario: UsuarioAutenticado
  token: string
  expiresAt: string
}

function resumirUsuario(usuario: User): UsuarioAutenticado {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

@Injectable()
export class AuthService {
  constructor(private readonly repositorio: AuthRepository) {}

  async identificar(email: string): Promise<{ existe: false } | ({ existe: true } & ResultadoAutenticacao)> {
    const usuario = await this.repositorio.buscarUsuarioPorEmail(email.trim().toLowerCase())
    if (!usuario) return { existe: false }
    return { existe: true, ...(await this.criarSessao(usuario)) }
  }

  async cadastrar(nome: string, email: string): Promise<ResultadoAutenticacao> {
    let usuario: User
    try {
      usuario = await this.repositorio.criarUsuario({ nome: nome.trim(), email: email.trim().toLowerCase() })
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException('Já existe uma conta com este e-mail')
      }
      throw erro
    }
    return this.criarSessao(usuario)
  }

  async obterUsuario(token: string): Promise<UsuarioAutenticado> {
    const sessao = await this.repositorio.buscarSessaoValida(hashToken(token), new Date())
    if (!sessao) throw new UnauthorizedException('Sessão inválida ou expirada')
    const usuario = await this.repositorio.buscarUsuarioPorId(sessao.userId)
    if (!usuario) throw new UnauthorizedException('Usuário da sessão não existe')
    return resumirUsuario(usuario)
  }

  async sair(token: string): Promise<void> {
    await this.repositorio.revogarSessao(hashToken(token))
  }

  private async criarSessao(usuario: User): Promise<ResultadoAutenticacao> {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + DURACAO_SESSAO_MS)
    await this.repositorio.criarSessao({
      userId: usuario.id,
      tokenHash: hashToken(token),
      expiresAt,
    })
    return { usuario: resumirUsuario(usuario), token, expiresAt: expiresAt.toISOString() }
  }
}
