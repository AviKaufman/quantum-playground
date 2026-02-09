'use client'

import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid } from 'lucide-react'

export type DesignId = 'classic' | 'studio' | 'dashboard' | 'focus' | 'notebook'

const STORAGE_KEY = 'qp_ui_v1'

const designs: { id: DesignId; label: string; description: string }[] = [
  { id: 'studio', label: 'Studio', description: 'Vertical tool rail + wide canvas.' },
  { id: 'dashboard', label: 'Dashboard', description: 'Tabs, compact, data-forward.' },
  { id: 'focus', label: 'Focus', description: 'Circuit-first, results in a drawer.' },
  { id: 'notebook', label: 'Notebook', description: 'Guided layout with notes.' },
  { id: 'classic', label: 'Classic', description: 'Original 2-column layout.' },
]

function applyDesign(design: DesignId) {
  const root = document.documentElement
  root.dataset.ui = design
}

export function DesignPicker() {
  // Keep server + initial client render consistent to avoid hydration mismatches.
  const [design, setDesign] = useState<DesignId>('studio')

  const current = useMemo(() => designs.find((d) => d.id === design) || designs[0], [design])

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const found = designs.some((d) => d.id === stored)
    const next = (found ? stored : 'studio') as DesignId
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesign(next)
  }, [])

  useEffect(() => {
    applyDesign(design)
    window.localStorage.setItem(STORAGE_KEY, design)
  }, [design])

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
        <LayoutGrid className="h-4 w-4" />
        UI
      </span>
      <label className="sr-only" htmlFor="design">
        UI layout
      </label>
      <select
        id="design"
        value={design}
        onChange={(e) => setDesign(e.target.value as DesignId)}
        className="h-9 rounded-full border border-border bg-background/70 px-3 text-sm text-foreground shadow-sm shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
        title={current.description}
      >
        {designs.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  )
}
