import type { ReactNode } from 'react'

type Props = { children: ReactNode; preview: string }

export function EmailLayout({ children, preview }: Props) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: '16px', backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <span style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>{preview}</span>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ maxWidth: 640, margin: '0 auto' }}>
          <tbody>
            <tr>
              <td>{children}</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}
