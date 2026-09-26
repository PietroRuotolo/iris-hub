import { cookies } from 'next/headers'
import { chamarAuth, COOKIE_SESSAO, limparCookieSessao } from '@/lib/server/auth-api'

export async function GET() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  if (!token) return Response.json({ erro: 'Não autenticado' }, { status: 401 })

  const resposta = await chamarAuth('/auth/me', 'GET', undefined, token)
  if (resposta.status === 401) limparCookieSessao(resposta)
  return resposta
}
