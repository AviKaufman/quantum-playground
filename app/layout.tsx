import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quantum Playground',
  description: 'Interactive quantum circuit sandbox with a statevector simulator and seeded measurement sampling.',
  openGraph: {
    title: 'Quantum Playground',
    description: 'Build and simulate quantum circuits in your browser.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
