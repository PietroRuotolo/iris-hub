import { Body, Controller, Get, Logger, Param, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import { repassar } from '../../../core/utils/encaminhar.js'
import type { RespostaServico } from '../../../core/utils/encaminhar.js'
import { EmailsClient } from '../../emails/clients/emails.client.js'
import { WhatsappClient } from '../../whatsapp/clients/whatsapp.client.js'
import { UsersClient } from '../clients/users.client.js'

/** Quanto o cadastro espera as boas-vindas (e-mail e WhatsApp) antes de responder sem elas. */
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
    private readonly whatsapp: WhatsappClient,
  ) {}

  /**
   * Rota só de criação de conta (página /cadastro do site). Com a conta criada, manda as boas-vindas ao
   * mesmo tempo: o e-mail e o WhatsApp com a imagem (para o telefone cadastrado), e diz na resposta o que
   * saiu (`emailEnviado`, `whatsappEnviado`). O cadastro nunca falha por causa delas. O envio é esperado
   * (com limite) em vez de ficar em segundo plano: na Vercel, o que roda depois da resposta pode ser cortado.
   */
  @Post()
  async criar(@Body() corpo: unknown, @Res({ passthrough: true }) res: Response) {
    const resposta = await this.usuarios.criar(corpo)
    const conta = resposta.corpo as { email?: unknown; telefone?: unknown } | null
    if (resposta.status !== 201 || typeof conta?.email !== 'string') return repassar(resposta, res)
    const telefone = typeof conta.telefone === 'string' && conta.telefone ? conta.telefone : null
    const [emailEnviado, whatsappEnviado] = await Promise.all([
      this.comLimite('E-mail de boas-vindas', () => this.emails.enviar({ para: conta.email, template: 'welcome' })),
      telefone ? this.comLimite('WhatsApp de boas-vindas', () => this.whatsapp.enviar({ para: telefone, template: 'welcome' })) : false,
    ])
    return repassar({ ...resposta, corpo: { ...conta, emailEnviado, whatsappEnviado } }, res)
  }

  @Get()
  async buscar(@Query('busca') busca: string | undefined, @Query('limite') limite: string | undefined, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.buscar(busca ?? '', limite), res)
  }

  @Get(':id')
  async obter(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    return repassar(await this.usuarios.obter(id), res)
  }

  /** Espera o envio até o limite; true se saiu. Falha ou demora vão para o log, nunca para o cadastro. */
  private async comLimite(nome: string, enviar: () => Promise<RespostaServico>): Promise<boolean> {
    let limite: ReturnType<typeof setTimeout> | undefined
    const tempoEsgotado = new Promise<'tempo'>((resolver) => {
      limite = setTimeout(() => resolver('tempo'), this.limiteEmailMs)
    })
    try {
      const resultado = await Promise.race([enviar(), tempoEsgotado])
      if (resultado === 'tempo') {
        this.log.warn(`${nome} não saiu em ${this.limiteEmailMs} ms`)
        return false
      }
      if (resultado.status >= 300) this.log.warn(`${nome} falhou: ${resultado.status} ${JSON.stringify(resultado.corpo)}`)
      return resultado.status < 300
    } catch (erro) {
      this.log.warn(`${nome} falhou: ${erro instanceof Error ? erro.message : String(erro)}`)
      return false
    } finally {
      clearTimeout(limite)
    }
  }
}
