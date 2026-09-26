import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import Shell from '@/components/layout/Shell'
import './globals.css'

const poppins = Poppins({ variable: '--font-poppins', subsets: ['latin'], weight: ['500', '600', '700'] })
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'iris hub',
  description: 'Jogo de ritmo controlado pelo olhar, com calibração, sessões e resumo simulado.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
