import { createHash, randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { DIAS_VALIDADE_RESUMO, primeiroNome } from '@iris/contracts'
import { ConflitoException, NaoEncontradoException } from '@iris/shared'
import type { CreateResumoRequestDto } from '../dtos/request/create-resumo.request.dto.js'
import { ResumoCompartilhadoResponseDto, ResumoCriadoResponseDto } from '../dtos/response/resumo.response.dto.js'
import { ResumosRepository } from '../repositories/resumos.repository.js'

const DIA_MS = 24 * 60 * 60 * 1000

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

/** Token do link: aleatório, sem nada da pessoa (o celular não tem login, então o token é a chave). */
const TOKEN_VALIDO = /^[A-Za-z0-9_-]{20,100}$/

@Injectable()
export class ResumosService {
  constructor(private readonly repositorio: ResumosRepository) {}

  /** Fixa a última partida encerrada de cada jogo e devolve o token do link (o banco guarda o hash). */
  async criar(dados: CreateResumoRequestDto, agora = new Date()): Promise<ResumoCriadoResponseDto> {
    const [ritmo, reflexo, cores] = await Promise.all([
      this.repositorio.ultimaRitmo(dados.participanteId),
      this.repositorio.ultimaReflexo(dados.participanteId),
      this.repositorio.ultimaCores(dados.participanteId),
    ])
    if (!ritmo && !reflexo && !cores) {
      throw new ConflitoException('Nenhuma partida encerrada ainda: jogue ao menos um dos jogos para gerar o resumo')
    }

    const token = randomBytes(24).toString('base64url')
    const expiraEm = new Date(agora.getTime() + DIAS_VALIDADE_RESUMO * DIA_MS)
    const sessoes = { ritmo: ritmo?.id ?? null, reflexo: reflexo?.id ?? null, cores: cores?.id ?? null }
    await this.repositorio.criar({
      tokenHash: hashToken(token),
      participanteId: dados.participanteId,
      nome: primeiroNome(dados.nome),
      sessaoRitmoId: sessoes.ritmo,
      sessaoReflexoId: sessoes.reflexo,
      sessaoCoresId: sessoes.cores,
      criadoEm: agora,
      expiraEm,
    })
    return Object.assign(new ResumoCriadoResponseDto(), { token, expiraEm: expiraEm.toISOString(), sessoes })
  }

  /** O resumo do link. Token inválido, inexistente ou vencido: 404 (sem dizer qual dos três). */
  async obter(token: string, agora = new Date()): Promise<ResumoCompartilhadoResponseDto> {
    const resumo = TOKEN_VALIDO.test(token) ? await this.repositorio.buscarPorTokenHash(hashToken(token)) : null
    if (!resumo || resumo.expiraEm.getTime() <= agora.getTime()) {
      throw new NaoEncontradoException('Resumo', 'deste link (inválido ou vencido)')
    }
    const [ritmo, reflexo, cores] = await Promise.all([
      this.repositorio.sessaoRitmo(resumo.sessaoRitmoId),
      this.repositorio.sessaoReflexo(resumo.sessaoReflexoId),
      this.repositorio.sessaoCores(resumo.sessaoCoresId),
    ])
    return ResumoCompartilhadoResponseDto.de(resumo, { ritmo, reflexo, cores })
  }
}
