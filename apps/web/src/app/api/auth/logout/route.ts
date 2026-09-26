import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { chamarAuth, COOKIE_SESSAO, limparCookieSessao } from '@/lib/server/auth-api'

export async function POST() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  const resposta = token
    ? await chamarAuth('/auth/logout', 'POST', undefined, token)
    : NextResponse.json({ ok: true })
  return limparCookieSessao(resposta)
}
