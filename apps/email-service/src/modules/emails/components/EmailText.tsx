import type { ReactNode } from 'react'

type Props = { children: ReactNode; as?: 'p' | 'h1' }

export function EmailText({ children, as = 'p' }: Props) {
  if (as === 'h1') {
    return <h1 style={{ margin: '0 0 16px', color: '#17324d', fontSize: 26, lineHeight: 1.25 }}>{children}</h1>
  }
  return <p style={{ margin: '0 0 16px', color: '#344b5f', fontSize: 16, lineHeight: 1.6 }}>{children}</p>
}
