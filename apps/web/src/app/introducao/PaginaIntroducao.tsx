'use client'

import { useRouter } from 'next/navigation'
import Historia from '@/features/historia/components/Historia'

// Menu "Introdução": a mesma história do primeiro acesso, com voltar, pular e sair.
export default function PaginaIntroducao() {
  const router = useRouter()
  return <Historia modo="livre" aoTerminar={() => router.push('/')} />
}
