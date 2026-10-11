import { Suspense } from 'react'
import FormularioCadastro from '@/features/jogadores/components/FormularioCadastro'

// Criação de conta de jogador (rota própria; não há login).
export default function Cadastro() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Criar conta</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Cadastre quem vai jogar. As partidas ficam salvas na conta da pessoa.</p>
      <div className="mt-4 max-w-md">
        <Suspense>
          <FormularioCadastro />
        </Suspense>
      </div>
    </>
  )
}
