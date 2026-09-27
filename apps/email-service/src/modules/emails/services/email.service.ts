import { Injectable } from '@nestjs/common'
import { renderToStaticMarkup } from 'react-dom/server'
import type { SendEmailRequestDto } from '../dtos/request/send-email.request.dto.js'
import { renderizarTemplate } from '../templates/welcome.template.js'
import { MicrosoftGraphClient } from './microsoft-graph.client.js'

@Injectable()
export class EmailService {
  constructor(private readonly microsoftGraph: MicrosoftGraphClient) {}

  async enviar(dados: SendEmailRequestDto): Promise<{ enviado: true }> {
    const template = renderizarTemplate(dados.template)
    const html = `<!doctype html>${renderToStaticMarkup(template.elemento)}`
    await this.microsoftGraph.enviar({ para: dados.para, assunto: template.assunto, html })
    return { enviado: true }
  }
}
