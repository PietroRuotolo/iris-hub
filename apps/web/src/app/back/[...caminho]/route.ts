import type { NextRequest } from 'next/server'
import { ErroBackend, urlBackend } from '@/lib/server/backend'

// /back/<rota> → gateway/<rota>, no mesmo domínio do site (sem porta, sem CORS). A API_KEY é
// adicionada aqui, no servidor; o jogador escolhido na página (x-jogador-id) segue junto, e o gateway
// confere que a conta existe.
const HEADER_JOGADOR = 'x-jogador-id'

type Contexto = { params: Promise<{ caminho: string[] }> }

async function repassar(req: NextRequest, { params }: Contexto): Promise<Response> {
  const { caminho } = await params

  const apiKey = process.env.API_KEY
  if (!apiKey) return Response.json({ erro: 'API_KEY não configurada no servidor web' }, { status: 500 })

  let destino: URL
  try {
    destino = await urlBackend('/' + caminho.map(encodeURIComponent).join('/'))
  } catch (erro) {
    const mensagem = erro instanceof ErroBackend ? erro.message : 'Backend indisponível'
    return Response.json({ erro: mensagem }, { status: 503 })
  }
  destino.search = req.nextUrl.search

  const headers = new Headers({ 'x-api-key': apiKey })
  const tipo = req.headers.get('content-type')
  if (tipo) headers.set('content-type', tipo)
  const jogador = req.headers.get(HEADER_JOGADOR)
  if (jogador) headers.set(HEADER_JOGADOR, jogador)

  const temCorpo = req.method !== 'GET' && req.method !== 'HEAD'
  let resposta: Response
  try {
    resposta = await fetch(destino, {
      method: req.method,
      headers,
      body: temCorpo ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
    })
  } catch {
    return Response.json({ erro: 'Não foi possível conectar ao backend' }, { status: 502 })
  }

  const saida = new Headers()
  const tipoResposta = resposta.headers.get('content-type')
  if (tipoResposta) saida.set('content-type', tipoResposta)
  const semCorpo = resposta.status === 204 || resposta.status === 304
  return new Response(semCorpo ? null : await resposta.arrayBuffer(), { status: resposta.status, headers: saida })
}

export { repassar as GET, repassar as POST, repassar as PUT, repassar as PATCH, repassar as DELETE }
