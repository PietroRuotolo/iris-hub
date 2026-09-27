import SeletorTela from '@/features/configuracoes/components/SeletorTela'

export default function Configuracoes() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-navy)]">Configurações</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Ajustes deste aparelho. Ficam salvos neste navegador.
      </p>
      <div className="mt-4">
        <SeletorTela />
      </div>
    </>
  )
}
