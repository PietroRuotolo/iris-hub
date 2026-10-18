import { Body, Controller, Get, Logger, Param, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import { EmailsClient } from '../../emails/clients/emails.client.js'
import { UsersClient } from '../clients/users.client.js'

/** Quanto o cadastro espera o e-mail de boas-vindas antes de responder sem ele. */
export const LIMITE_EMAIL_MS = 5000

/** Contas dos jogadores: mesmas rotas do user-service; status e corpo vêm dele. */
@Controller('users')
export class UsersController {
  private readonly log = new Logger(UsersController.name)
  /** Ajustável nos testes. */
  limiteEmailMs = LIMITE_EMAIL_MS

  constructor(
    private readonly usuarios: UsersClient,
    private readonly emails: EmailsClient,
  ) {}

  /**
   * Rota só de criação de conta (página /cadastro do site). Com a conta criada, manda o e-mail de
   * boas-vindas e diz na resposta se ele saiu (`emailEnviado`). O cadastro nunca falha por causa do
   * e-mail. O envio é esperado (com limite) em vez de ficar em segundo plano: na Vercel, o que roda
   * depois da resposta pode ser cortado.
   */
  @Post()
  async criar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const resposta = await this.usuarios.criar(corpo)
    const conta = resposta.corpo as { email?: unknown } | null
    if (resposta.status !== 201 || typeof conta?.email !== 'string') return repassar(resposta, res)
    return repassar({ ...resposta, corpo: { ...conta, emailEnviado: await this.boasVindas(conta.email) } }, res)
  }

  @Get()
  async buscar(@Query('busca') busca: string | undefined, @Query('limite') limite: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.buscar(busca ?? '', limite), res)
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.obter(id), res)
  }

  private async boasVindas(email: string): Promise<boolean> {
    let limite: ReturnType<typeof setTimeout> | undefined
    const tempoEsgotado = new Promise<'tempo'>((resolver) => {
      limite = setTimeout(() => resolver('tempo'), this.limiteEmailMs)
    })
    try {
      const resultado = await Promise.race([this.emails.enviar({ para: email, template: 'welcome' }), tempoEsgotado])
      if (resultado === 'tempo') {
        this.log.warn(`E-mail de boas-vindas não saiu em ${this.limiteEmailMs} ms`)
        return false
      }
      if (resultado.status >= 300) this.log.warn(`E-mail de boas-vindas falhou: ${resultado.status} ${JSON.stringify(resultado.corpo)}`)
      return resultado.status < 300
    } catch (erro) {
      this.log.warn(`E-mail de boas-vindas falhou: ${erro instanceof Error ? erro.message : String(erro)}`)
      return false
    } finally {
      clearTimeout(limite)
    }
  }
}
