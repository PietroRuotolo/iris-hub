// Alvo de fixação em tela cheia: o anel externo encolhe até o participante fixar o olhar,
// e pulsa suavemente durante a coleta. Mesmo papel visual do target() do protótipo Python.
export default function AlvoFixacao({ x, y, progresso, coletando }) {
  const raioAnel = 60 - 40 * Math.min(progresso, 1)

  return (
    <svg
      className="pointer-events-none fixed inset-0 h-full w-full"
      aria-hidden="true"
      style={{ left: 0, top: 0 }}
    >
      <circle
        cx={x}
        cy={y}
        r={raioAnel}
        fill="none"
        stroke="var(--color-warn)"
        strokeWidth={3}
        className={coletando ? 'animate-pulse' : ''}
      />
      <circle cx={x} cy={y} r={20} fill="var(--color-warn)" />
      <circle cx={x} cy={y} r={5} fill="var(--color-bg)" />
    </svg>
  )
}
