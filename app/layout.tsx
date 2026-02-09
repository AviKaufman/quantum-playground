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
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="min-h-screen">
          <header className="sticky top-0 z-50 border-b border-border/70 bg-background/55 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-lg font-semibold tracking-tight">
                  Quantum Playground
                </span>
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  circuits, simulation, share links
                </span>
              </div>
              <nav className="flex items-center gap-4">
                <a
                  href="https://avi-kaufman.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Back to avi-kaufman.com"
                >
                  avi-kaufman.com
                </a>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
