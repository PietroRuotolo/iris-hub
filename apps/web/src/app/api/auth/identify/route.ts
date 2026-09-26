import { chamarAuth } from '@/lib/server/auth-api'

export async function POST(request: Request) {
  let corpo: unknown
  try {
    corpo = await request.json()
  } catch {
    return Response.json({ erro: 'Envie um e-mail válido' }, { status: 400 })
  }
  return chamarAuth('/auth/identify', 'POST', corpo)
}
