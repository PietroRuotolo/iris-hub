import { FlaskConical } from 'lucide-react'

/** Aviso e botões do modo simulação (só em desenvolvimento, com ?simular na URL). */
export default function PainelSimulacao({ acoes }: { acoes: { rotulo: string; aoClicar: () => void }[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-warn-bg)] p-4" role="note">
      <p className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
        <FlaskConical size={16} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />
        Modo simulação: os eventos imitam o ESP32 e as partidas são gravadas no banco de verdade. Só existe em
        desenvolvimento.
      </p>
      <div className="flex flex-wrap gap-2">
        {acoes.map(({ rotulo, aoClicar }) => (
          <button
            key={rotulo}
            type="button"
            onClick={aoClicar}
            className="cursor-pointer rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-navy)] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy)]"
          >
            {rotulo}
          </button>
        ))}
      </div>
    </div>
  )
}
