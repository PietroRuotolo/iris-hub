import { ConflictException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { User } from '@prisma/client'
import { NaoEncontradoException } from '@iris/shared'
import type { CreateUserRequestDto } from '../dtos/request/create-user.request.dto.js'
import type { JogadorResponse, UsuarioCriadoResponse } from '../dtos/response/user.response.dto.js'
import { UsersRepository } from '../repositories/users.repository.js'
import { mascararEmail, regexBuscaPorNome } from './busca.js'

const LIMITE_BUSCA_PADRAO = 10

function jogador(u: Pick<User, 'id' | 'nome' | 'email'>): JogadorResponse {
  return { id: u.id, nome: u.nome, emailMascarado: mascararEmail(u.email) }
}

/** Contas de jogadores. Não há login: quem joga é escolhido no site, na hora de jogar. */
@Injectable()
export class UsersService {
  constructor(private readonly repositorio: UsersRepository) {}

  async criar(dados: CreateUserRequestDto): Promise<UsuarioCriadoResponse> {
    let usuario: User
    try {
      usuario = await this.repositorio.criar({ nome: dados.nome, email: dados.email, telefone: dados.telefone })
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException('Já existe uma conta com este e-mail')
      }
      throw erro
    }
    return { ...jogador(usuario), email: usuario.email, telefone: usuario.telefone }
  }

  async buscar(termo: string, limite = LIMITE_BUSCA_PADRAO): Promise<JogadorResponse[]> {
    return (await this.repositorio.buscarPorNome(regexBuscaPorNome(termo), limite)).map(jogador)
  }

  async obter(id: string): Promise<JogadorResponse> {
    const usuario = await this.repositorio.buscarPorId(id)
    if (!usuario) throw new NaoEncontradoException('Jogador', id)
    return jogador(usuario)
  }
}
