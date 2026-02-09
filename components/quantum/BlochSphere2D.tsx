'use client'

import { type BlochVector } from '@/lib/quantum/simulator'

type BlochSphere2DProps = {
  vector: BlochVector
  label?: string
}

const clamp01 = (v: number) => Math.max(-1, Math.min(1, v))

export function BlochSphere2D({ vector, label = 'Bloch sphere (x-z projection)' }: BlochSphere2DProps) {
  const x = clamp01(vector.x)
  const y = clamp01(vector.y)
  const z = clamp01(vector.z)
  const r = Math.min(1, Math.sqrt(x * x + y * y + z * z))

  const size = 200
  const pad = 16
  const radius = (size - pad * 2) / 2
  const cx = size / 2
  const cy = size / 2

  const px = cx + x * radius
  const py = cy - z * radius

  return (
    <div className="rounded-2xl border border-border glass ring-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            x={x.toFixed(3)} y={y.toFixed(3)} z={z.toFixed(3)} |r|={r.toFixed(3)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Bloch sphere projection"
          className="max-w-full"
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="10"
              markerHeight="10"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--primary))" />
            </marker>
          </defs>

          {/* Sphere */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="hsl(var(--muted))"
            fillOpacity={0.22}
            stroke="hsl(var(--border))"
            strokeWidth={2}
          />

          {/* Axes */}
          <line
            x1={cx - radius}
            y1={cy}
            x2={cx + radius}
            y2={cy}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
          <line
            x1={cx}
            y1={cy - radius}
            x2={cx}
            y2={cy + radius}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />

          {/* Labels */}
          <text x={cx + radius + 6} y={cy + 4} fontSize="11" fill="hsl(var(--muted-foreground))">
            +x
          </text>
          <text x={cx - radius - 18} y={cy + 4} fontSize="11" fill="hsl(var(--muted-foreground))">
            -x
          </text>
          <text x={cx - 6} y={cy - radius - 6} fontSize="11" fill="hsl(var(--muted-foreground))">
            +z
          </text>
          <text x={cx - 6} y={cy + radius + 14} fontSize="11" fill="hsl(var(--muted-foreground))">
            -z
          </text>

          {/* Vector (projected) */}
          <line
            x1={cx}
            y1={cy}
            x2={px}
            y2={py}
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            markerEnd="url(#arrow)"
          />
          <circle cx={px} cy={py} r={4} fill="hsl(var(--primary))" />
        </svg>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        This view projects the Bloch vector onto the x-z plane. y is shown numerically above.
      </p>
    </div>
  )
}
