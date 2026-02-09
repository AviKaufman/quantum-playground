'use client'

import { useEffect, useMemo, useState } from 'react'
import { Moon, SunMedium, Sparkles } from 'lucide-react'

type ThemeId = 'paper' | 'ice' | 'noir' | 'prism' | 'terminal'

const STORAGE_KEY = 'qp_theme_v1'

const themes: { id: ThemeId; label: string; mode: 'light' | 'dark' }[] = [
  { id: 'noir', label: 'Noir Aurora', mode: 'dark' },
  { id: 'prism', label: 'Midnight Prism', mode: 'dark' },
  { id: 'terminal', label: 'Dusk Terminal', mode: 'dark' },
  { id: 'paper', label: 'Paper Lab', mode: 'light' },
  { id: 'ice', label: 'Ice Glass', mode: 'light' },
]

function applyTheme(theme: ThemeId) {
  const root = document.documentElement
  const info = themes.find((t) => t.id === theme) || themes[0]
  root.dataset.theme = info.id
  root.classList.toggle('dark', info.mode === 'dark')
}

export function ThemePicker() {
  // Keep server + initial client render consistent to avoid hydration mismatches.
  const [theme, setTheme] = useState<ThemeId>('noir')
  const current = useMemo(() => themes.find((t) => t.id === theme) || themes[0], [theme])

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const found = themes.some((t) => t.id === stored)
    const next = (found ? stored : 'noir') as ThemeId
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(next)
  }, [])

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const Icon = current.mode === 'dark' ? Moon : SunMedium

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        Theme
      </span>
      <label className="sr-only" htmlFor="theme">
        Theme
      </label>
      <div className="relative">
        <select
          id="theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeId)}
          className="h-9 rounded-full border border-border bg-background/70 pl-3 pr-9 text-sm text-foreground shadow-sm shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <Sparkles className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}
