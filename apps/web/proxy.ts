import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_SESSAO = 'iris_session'
const ROTA_LOGIN = '/login'

// O proxy faz a checagem rápida; a validade da sessão é confirmada no user-service.
export function proxy(request: NextRequest) {
  const autenticado = request.cookies.has(COOKIE_SESSAO)
  const estaNoLogin = request.nextUrl.pathname === ROTA_LOGIN

  if (autenticado && estaNoLogin) return NextResponse.redirect(new URL('/', request.url))
  if (autenticado || estaNoLogin) return NextResponse.next()

  return NextResponse.redirect(new URL(ROTA_LOGIN, request.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
