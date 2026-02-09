'use client'

import { useEffect, useState } from 'react'
import { QuantumPlaygroundByDesign } from '@/components/quantum/QuantumPlaygroundLayouts'
import type { DesignId } from '@/components/ui/DesignPicker'

export default function HomePage() {
  const [design, setDesign] = useState<DesignId>(() => {
    if (typeof window === 'undefined') return 'studio'
    return (document.documentElement.dataset.ui as DesignId | undefined) || 'studio'
  })

  useEffect(() => {
    const root = document.documentElement
    const obs = new MutationObserver(() => {
      const next = (root.dataset.ui as DesignId | undefined) || 'studio'
      setDesign(next)
    })
    obs.observe(root, { attributes: true, attributeFilter: ['data-ui'] })
    return () => obs.disconnect()
  }, [])

  return (
    <div className="py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-border glass ring-soft">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[hsl(var(--aurora-a)/0.42)] blur-3xl" />
            <div className="absolute -top-16 right-0 h-64 w-64 rounded-full bg-[hsl(var(--aurora-b)/0.30)] blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-[hsl(var(--aurora-c)/0.28)] blur-3xl" />
          </div>

          <div className="relative p-8 sm:p-10">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Quantum Playground
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl font-display font-semibold tracking-tight text-balance">
                Interactive quantum circuit sandbox
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Build small circuits, simulate them with a statevector backend, and share seeded measurement results.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-border bg-background/60 px-3 py-1">
                  Deterministic sampling
                </span>
                <span className="rounded-full border border-border bg-background/60 px-3 py-1">
                  Shareable permalinks
                </span>
                <span className="rounded-full border border-border bg-background/60 px-3 py-1">
                  Bloch vector view
                </span>
                <span className="rounded-full border border-border bg-background/60 px-3 py-1">
                  TypeScript + Next.js
                </span>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                MVP scope: core gates, sampling, and a Bloch vector projection. Next iterations add rotations, better
                visuals, and optional noise models.
              </p>
            </div>
          </div>
        </div>

        <QuantumPlaygroundByDesign design={design} />
      </div>
    </div>
  )
}
