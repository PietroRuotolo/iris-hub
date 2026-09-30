import type { ResumoCompartilhado } from '@iris/contracts'
import { ErroBackend, urlBackend } from './backend'

// Só no servidor Next: a página /resultado (aberta no celular, sem login) busca o resumo direto no
// backend, com a API_KEY. O navegador do celular nunca fala com o gateway.

export type BuscaResumo =
  | { tipo: 'ok'; resumo: ResumoCompartilhado }
  | { tipo: 'inexistente' }
  | { tipo: 'erro'; mensagem: string }

export async function buscarResumoCompartilhado(token: string): Promise<BuscaResumo> {
  const apiKey = process.env.API_KEY
  if (!apiKey) return { tipo: 'erro', mensagem: 'API_KEY não configurada no servidor web' }
  try {
    const resposta = await fetch(await urlBackend(`/resumos/${encodeURIComponent(token)}`), {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    })
    if (resposta.status === 404) return { tipo: 'inexistente' }
    if (!resposta.ok) return { tipo: 'erro', mensagem: `O servidor respondeu ${resposta.status}` }
    return { tipo: 'ok', resumo: (await resposta.json()) as ResumoCompartilhado }
  } catch (erro) {
    return { tipo: 'erro', mensagem: erro instanceof ErroBackend ? erro.message : 'Não foi possível conectar ao servidor' }
  }
}
