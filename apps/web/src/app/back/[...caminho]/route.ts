import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { COOKIE_SESSAO } from '@/lib/server/auth-api'
import { urlBackend } from '@/lib/server/backend'

// /back/<rota> → gateway/<rota>, no mesmo domínio do site (sem porta, sem CORS).
// A API_KEY e o token da sessão são adicionados aqui, no servidor.
type Contexto = { params: Promise<{ caminho: string[] }> }

async function repassar(req: NextRequest, { params }: Contexto): Promise<Response> {
  const { caminho } = await params

  // As rotas de auth devolvem o token no corpo; elas passam por /api/auth, que o guarda em cookie HttpOnly.
  if (caminho[0] === 'auth') {
    return Response.json({ erro: 'Use /api/auth para autenticação' }, { status: 404 })
  }

  const apiKey = process.env.API_KEY
  if (!apiKey) return Response.json({ erro: 'API_KEY não configurada no servidor web' }, { status: 500 })

  const destino = urlBackend('/' + caminho.map(encodeURIComponent).join('/'))
  destino.search = req.nextUrl.search

  const headers = new Headers({ 'x-api-key': apiKey })
  const tipo = req.headers.get('content-type')
  if (tipo) headers.set('content-type', tipo)
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  if (token) headers.set('authorization', `Bearer ${token}`)

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
