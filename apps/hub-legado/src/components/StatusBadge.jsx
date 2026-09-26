import { STATUS } from '../data/softwares'

export default function StatusBadge({ status }) {
  const { label, classes } = STATUS[status]
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
