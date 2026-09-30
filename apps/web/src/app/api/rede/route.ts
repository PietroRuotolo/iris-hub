import { networkInterfaces } from 'node:os'
import type { NextRequest } from 'next/server'
import { enderecosDaRede } from '@/lib/server/rede'

// Só em desenvolvimento: o endereço deste computador na rede local (ex.: http://192.168.0.15:3000),
// para o QR code abrir no celular quando o site foi aberto em localhost. Em produção não existe.
export function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return Response.json({ erro: 'Não encontrado' }, { status: 404 })
  const porta = req.nextUrl.port || '3000'
  return Response.json({ enderecos: enderecosDaRede(networkInterfaces(), porta) })
}