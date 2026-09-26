import type { Response as RespostaExpress } from 'express'
import { ServicoIndisponivelException } from '../exceptions/servico-indisponivel.exception.js'

export interface RespostaServico {
  status: number
  corpo: unknown
}

/**
 * Encaminha uma requisição JSON para um serviço interno e devolve status e corpo como vieram,
 * inclusive erros (4xx/5xx do serviço chegam iguais ao front-end). Se o serviço não responder,
 * lança 502.
 */
export async function encaminhar(
  servico: { nome: string; url: string },
  metodo: 'GET' | 'POST',
  caminho: string,
  corpo?: unknown,
  cabecalhos?: Record<string, string>,
): Promise<RespostaServico> {
  let resposta: Response
  try {
    resposta = await fetch(new URL(caminho, servico.url), {
      method: metodo,
      headers: { ...(corpo === undefined ? {} : { 'content-type': 'application/json' }), ...cabecalhos },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ServicoIndisponivelException(servico.nome)
  }
  const texto = await resposta.text()
  return { status: resposta.status, corpo: texto ? JSON.parse(texto) : null }
}

/** Devolve ao front-end a resposta do serviço como veio: aplica o status e retorna o corpo. */
export function repassar({ status, corpo }: RespostaServico, res: RespostaExpress): unknown {
  res.status(status)
  return corpo
}
