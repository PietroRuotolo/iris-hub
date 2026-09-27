import { NextResponse } from 'next/server'
import { urlBackend } from './backend'

export const COOKIE_SESSAO = 'iris_session'

export async function chamarAuth(
  caminho: string,
  metodo: 'GET' | 'POST',
  corpo?: unknown,
  token?: string,
): Promise<NextResponse> {
  const apiKey = process.env.API_KEY
  if (!apiKey) {
    return NextResponse.json({ erro: 'API_KEY não configurada no servidor web' }, { status: 500 })
  }

  let resposta: Response
  try {
    resposta = await fetch(urlBackend(caminho), {
      method: metodo,
      headers: {
        'x-api-key': apiKey,
        ...(corpo === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ erro: 'Não foi possível conectar ao serviço de autenticação' }, { status: 502 })
  }

  const texto = await resposta.text()
  let dados: Record<string, unknown> = {}
  if (texto) {
    try {
      dados = JSON.parse(texto) as Record<string, unknown>
    } catch {
      return NextResponse.json({ erro: 'Resposta inválida do serviço de autenticação' }, { status: 502 })
    }
  }

  const tokenNovo = typeof dados.token === 'string' ? dados.token : undefined
  const dadosPublicos = { ...dados }
  delete dadosPublicos.token
  const saida = resposta.status === 204
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json(dadosPublicos, { status: resposta.status })

  if (tokenNovo && resposta.ok && typeof dados.expiresAt === 'string') {
    const maxAge = Math.max(0, Math.floor((new Date(dados.expiresAt).getTime() - Date.now()) / 1000))
    saida.cookies.set(COOKIE_SESSAO, tokenNovo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    })
  }

  return saida
}

export function limparCookieSessao(resposta: NextResponse): NextResponse {
  resposta.cookies.set(COOKIE_SESSAO, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return resposta
}
