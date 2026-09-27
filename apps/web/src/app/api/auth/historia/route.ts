import { cookies } from 'next/headers'
import { chamarAuth, COOKIE_SESSAO } from '@/lib/server/auth-api'

// Marca na conta que a pessoa terminou a história de introdução.
export async function POST() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  if (!token) return Response.json({ erro: 'Não autenticado' }, { status: 401 })
  return chamarAuth('/auth/me/intro-seen', 'POST', undefined, token)
}
