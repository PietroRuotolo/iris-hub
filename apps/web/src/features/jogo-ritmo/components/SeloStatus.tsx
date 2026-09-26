import { STATUS_JOGO, type StatusJogo } from '../jogos'

// Selo com o status do jogo (ex.: "Em desenvolvimento").
export default function SeloStatus({ status }: { status: StatusJogo }) {
  const { label, classes } = STATUS_JOGO[status]
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{label}</span>
}
