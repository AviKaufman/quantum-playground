import type { Metadata } from 'next'
import './globals.css'
import { ThemePicker } from '@/components/ui/ThemePicker'
import { DesignPicker } from '@/components/ui/DesignPicker'

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
    <html lang="en" data-theme="noir" data-ui="studio">
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
              <div className="flex items-center gap-2">
                <DesignPicker />
                <ThemePicker />
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
