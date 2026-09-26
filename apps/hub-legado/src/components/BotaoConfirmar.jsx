import { useEffect, useState } from 'react'

// Botão de dois toques para ações destrutivas: o primeiro arma, o segundo confirma.
// Volta sozinho ao estado normal se ninguém confirmar em alguns segundos.
export default function BotaoConfirmar({ rotulo, rotuloConfirmar, aoConfirmar, Icone, className = '' }) {
  const [armado, setArmado] = useState(false)

  useEffect(() => {
    if (!armado) return undefined
    const timer = setTimeout(() => setArmado(false), 4000)
    return () => clearTimeout(timer)
  }, [armado])

  function aoClicar() {
    if (!armado) {
      setArmado(true)
      return
    }
    setArmado(false)
    aoConfirmar()
  }

  return (
    <button
      onClick={aoClicar}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-navy)] ${
        armado
          ? 'bg-[var(--color-warn)] text-[var(--color-surface)]'
          : 'bg-[var(--color-warn-bg)] text-[var(--color-ink)]'
      } ${className}`}
    >
      {Icone && <Icone size={18} />}
      {armado ? rotuloConfirmar : rotulo}
    </button>
  )
}
