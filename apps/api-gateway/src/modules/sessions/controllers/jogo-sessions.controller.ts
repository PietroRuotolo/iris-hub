import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Res, type Type } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { JogosSessionsClient, type JogoDeSessao } from '../clients/jogos-sessions.client.js'
import { ParticipanteService, comParticipante } from '../participante.service.js'

/**
 * Controller das sessões de um jogo com as rotas simples (iniciar, listar, obter, encerrar):
 * `POST /sessions/<jogo>`, `GET /sessions/<jogo>`, `GET /sessions/<jogo>/:id` e
 * `POST /sessions/<jogo>/:id/finish`. Exigem login: o gateway descobre a pessoa pelo token e envia o
 * id dela como participanteId (o site nunca escolhe de quem é a sessão).
 *
 * Um jogo novo com esse formato ganha as rotas com uma linha (veja o SessionsModule), e o
 * controller gerado precisa vir ANTES do SessionsController: `GET /sessions/<jogo>` não pode cair em
 * `GET /sessions/:id`.
 */
export function criarControllerSessoesJogo(jogo: JogoDeSessao): Type<unknown> {
  @Controller(`sessions/${jogo}`)
  class JogoSessionsController {
    constructor(
      readonly sessoes: JogosSessionsClient,
      readonly participante: ParticipanteService,
    ) {}

    @Post()
    async iniciar(@Headers('authorization') authorization: string | undefined, @Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
      const participanteId = await this.participante.doLogin(authorization)
      return repassar(await this.sessoes.iniciar(jogo, comParticipante(corpo, participanteId)), res)
    }

    @Get()
    async listar(@Headers('authorization') authorization: string | undefined, @Res({ passthrough: true }) res: Response) {
      return repassar(await this.sessoes.listar(jogo, await this.participante.doLogin(authorization)), res)
    }

    @Get(':id')
    async obter(@Headers('authorization') authorization: string | undefined, @Param('id') id: string, @Res({ passthrough: true }) res: Response) {
      return repassar(await this.sessoes.obter(jogo, id, await this.participante.doLogin(authorization)), res)
    }

    @Post(':id/finish')
    @HttpCode(HttpStatus.OK)
    async encerrar(
      @Headers('authorization') authorization: string | undefined,
      @Param('id') id: string,
      @Body() corpo: unknown,
      @Res({ passthrough: true }) res: Response,
    ) {
      const participanteId = await this.participante.doLogin(authorization)
      return repassar(await this.sessoes.encerrar(jogo, id, comParticipante(corpo, participanteId)), res)
    }
  }
  // Nome legível nos logs e no erro de DI (ex.: "ReflexoSessionsController").
  Object.defineProperty(JogoSessionsController, 'name', { value: `${jogo[0].toUpperCase()}${jogo.slice(1)}SessionsController` })
  return JogoSessionsController
}

export const ReflexoSessionsController = criarControllerSessoesJogo('reflexo')
export const CoresSessionsController = criarControllerSessoesJogo('cores')
