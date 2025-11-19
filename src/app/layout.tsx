import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ECP Generator',
  description: 'Sistema automatizado para generar estrategias de marketing ECP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
