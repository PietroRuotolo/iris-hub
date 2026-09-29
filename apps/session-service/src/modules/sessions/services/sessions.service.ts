import { Injectable } from '@nestjs/common'
import type { Sessao } from '@prisma/client'
import { FASES_JOGO, VERSAO_PONTUACAO, pontuarTentativa, resumirFase, resumirSessao } from '@iris/contracts'
import { ConflitoException, NaoEncontradoException } from '@iris/shared'
import type { CreateSessionRequestDto } from '../dtos/request/create-session.request.dto.js'
import type { FinishSessionRequestDto } from '../dtos/request/finish-session.request.dto.js'
import type { RegisterPhaseRequestDto } from '../dtos/request/register-phase.request.dto.js'
import { SessionsRepository } from '../repositories/sessions.repository.js'

/** Quantas sessões a listagem devolve por padrão e no máximo (a tela mostra o histórico recente). */
const LIMITE_PADRAO = 20
const LIMITE_MAXIMO = 100

@Injectable()
export class SessionsService {
  constructor(private readonly repositorio: SessionsRepository) {}

  iniciar(dados: CreateSessionRequestDto): Promise<Sessao> {
    const { tela, calibracao } = dados
    return this.repositorio.criar({
      participanteId: dados.participanteId ?? null,
      status: 'EM_ANDAMENTO',
      tela: {
        larguraPx: tela.larguraPx,
        alturaPx: tela.alturaPx,
        polegadas: tela.polegadas ?? null,
        pxPorCm: tela.pxPorCm ?? null,
      },
      calibracao: calibracao
        ? {
            pontos: calibracao.pontos,
            erroMedioPx: calibracao.erroMedioPx ?? null,
            qualidade: calibracao.qualidade ?? null,
            coberturaValida: calibracao.coberturaValida ?? null,
            distanciaMediaCm: calibracao.distanciaMediaCm ?? null,
            oculos: calibracao.oculos ?? null,
            fracaoReflexo: calibracao.fracaoReflexo ?? null,
            reflexoIgnorado: calibracao.reflexoIgnorado ?? false,
          }
        : null,
      fases: [],
      versaoPontuacao: VERSAO_PONTUACAO,
    })
  }

  /** As sessões da pessoa, da mais recente para a mais antiga. */
  listar(participanteId: string | null, limite = LIMITE_PADRAO): Promise<Sessao[]> {
    const quantas = Math.min(Math.max(Math.trunc(limite) || LIMITE_PADRAO, 1), LIMITE_MAXIMO)
    return this.repositorio.listarPorParticipante(participanteId ?? null, quantas)
  }

  /** A sessão, se for dessa pessoa. De outra pessoa responde igual a inexistente (404). */
  async obter(id: string, participanteId?: string | null): Promise<Sessao> {
    const sessao = await this.repositorio.buscarPorId(id)
    if (!sessao || sessao.participanteId !== (participanteId ?? null)) {
      throw new NaoEncontradoException('Sessão', id)
    }
    return sessao
  }

  /** Recalcula os pontos de cada alvo e o resumo da fase (não confia nos pontos do site) e grava. */
  async registrarFase(id: string, dados: RegisterPhaseRequestDto): Promise<Sessao> {
    const sessao = await this.obter(id, dados.participanteId)
    if (sessao.status !== 'EM_ANDAMENTO') throw new ConflitoException('A sessão já foi encerrada')
    if (sessao.fases.some((f) => f.fase === dados.fase)) {
      throw new ConflitoException(`A fase ${dados.fase} já foi registrada nesta sessão`)
    }

    const nome = FASES_JOGO.find((f) => f.fase === dados.fase)?.nome ?? `Fase ${dados.fase}`
    const tentativas = dados.tentativas.map((t) => ({
      sessaoId: id,
      fase: dados.fase,
      numeroAlvo: t.numeroAlvo,
      alvoX: t.alvoX,
      alvoY: t.alvoY,
      raioPx: t.raioPx,
      janelaMs: t.janelaMs,
      apresentadoEm: new Date(t.apresentadoEm),
      batidaEm: new Date(t.batidaEm),
      respostaEm: t.respostaEm ? new Date(t.respostaEm) : null,
      resultado: t.resultado,
      latenciaMs: t.latenciaMs ?? null,
      erroTempoMs: t.erroTempoMs ?? null,
      erroEspacial: t.erroEspacial ?? null,
      permanenciaMs: t.permanenciaMs ?? null,
      cobertura: t.cobertura,
      desvioXPx: t.desvioXPx ?? null,
      desvioYPx: t.desvioYPx ?? null,
      pontuacao: pontuarTentativa({
        resultado: t.resultado,
        erroTempoMs: t.erroTempoMs ?? null,
        janelaMs: t.janelaMs,
        erroEspacial: t.erroEspacial ?? null,
      }),
    }))

    const resumo = resumirFase(dados.fase, nome, tentativas)
    const totais = resumirSessao([...sessao.fases, resumo])
    const gravou = await this.repositorio.registrarFase(id, resumo, totais, tentativas)
    if (!gravou) throw new ConflitoException(`A fase ${dados.fase} já foi registrada ou a sessão foi encerrada`)
    return this.obter(id, dados.participanteId)
  }

  async encerrar(id: string, dados: FinishSessionRequestDto, agora = new Date()): Promise<Sessao> {
    await this.obter(id, dados.participanteId)
    const encerrou = await this.repositorio.concluir(id, dados.status, agora)
    if (!encerrou) throw new ConflitoException('A sessão já foi encerrada')
    return this.obter(id, dados.participanteId)
  }
}
