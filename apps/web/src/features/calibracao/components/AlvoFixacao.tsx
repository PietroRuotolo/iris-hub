// Alvo de fixação da calibração: halo com brilho, núcleo e ponto central. O anel externo encolhe
// até a pessoa fixar o olhar e pulsa durante a coleta. Cabe em RAIO_ALVO_CALIBRACAO (../layout.ts).
export default function AlvoFixacao({ x, y, progresso, coletando }: { x: number; y: number; progresso: number; coletando: boolean }) {
  const raioAnel = 60 - 22 * Math.min(progresso, 1)

  return (
    <svg className="pointer-events-none fixed inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <filter id="brilho-alvo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <circle cx={x} cy={y} r={44} fill="var(--color-warn)" opacity={0.25} filter="url(#brilho-alvo)" />
      <circle
        cx={x}
        cy={y}
        r={raioAnel}
        fill="none"
        stroke="var(--color-warn)"
        strokeOpacity={0.35}
        strokeWidth={2}
        className={coletando ? 'animate-pulse' : ''}
      />
      <circle cx={x} cy={y} r={36} fill="var(--color-warn-bg)" />
      <circle cx={x} cy={y} r={24} fill="var(--color-warn)" />
      <circle cx={x} cy={y} r={7} fill="var(--color-surface)" />
    </svg>
  )
}
