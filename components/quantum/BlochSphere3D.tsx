'use client'

import { useEffect, useRef, useState } from 'react'
import type { BlochVector } from '@/lib/quantum/simulator'

type BlochSphere3DProps = {
  vector: BlochVector
  label?: string
}

type Vec3 = { x: number; y: number; z: number }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function rotateX(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: p.x, y: c * p.y - s * p.z, z: s * p.y + c * p.z }
}

function rotateY(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: c * p.x + s * p.z, y: p.y, z: -s * p.x + c * p.z }
}

function project(p: Vec3, size: number, camZ: number) {
  const z = p.z + camZ
  const k = camZ / z
  const x = p.x * k
  const y = p.y * k
  const half = size / 2
  return { x: half + x * half, y: half - y * half, z: p.z }
}

export function BlochSphere3D({ vector, label = 'Bloch sphere (3D)' }: BlochSphere3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [yaw, setYaw] = useState(0.9)
  const [pitch, setPitch] = useState(-0.45)
  const [dragging, setDragging] = useState(false)

  const x = clamp(vector.x, -1, 1)
  const y = clamp(vector.y, -1, 1)
  const z = clamp(vector.z, -1, 1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
    const cssSize = 280
    canvas.style.width = `${cssSize}px`
    canvas.style.height = `${cssSize}px`
    canvas.width = cssSize * dpr
    canvas.height = cssSize * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const size = cssSize
    const camZ = 2.8

    const borderRaw = getComputedStyle(document.documentElement).getPropertyValue('--border').trim()
    const mutedRaw = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim()
    const primaryRaw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    const cardRaw = getComputedStyle(document.documentElement).getPropertyValue('--card').trim()

    const border = borderRaw ? `hsl(${borderRaw} / 0.55)` : 'rgba(255,255,255,0.18)'
    const text = mutedRaw ? `hsl(${mutedRaw} / 1)` : 'rgba(255,255,255,0.72)'
    const primary = primaryRaw ? `hsl(${primaryRaw} / 0.95)` : 'rgba(255,255,255,0.9)'
    const primarySoft = primaryRaw ? `hsl(${primaryRaw} / 0.35)` : 'rgba(255,255,255,0.35)'

    ctx.clearRect(0, 0, size, size)

    // Backplate.
    ctx.fillStyle = cardRaw ? `hsl(${cardRaw} / 0.12)` : 'rgba(255,255,255,0.06)'
    ctx.fillRect(0, 0, size, size)

    const applyView = (p0: Vec3) => project(rotateX(rotateY(p0, yaw), pitch), size, camZ)
    const vec = { x, y, z }

    // Sphere outline.
    ctx.strokeStyle = border
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, (size * 0.42), 0, Math.PI * 2)
    ctx.stroke()

    // Lat/long grid with depth cueing.
    const drawPolyline = (pts: Vec3[]) => {
      for (let i = 0; i < pts.length - 1; i += 1) {
        const a = applyView(pts[i])
        const b = applyView(pts[i + 1])
        const depth = (a.z + b.z) / 2
        const alpha = clamp(0.10 + (depth + 1) * 0.18, 0.06, 0.32)
        ctx.strokeStyle = borderRaw ? `hsl(${borderRaw} / ${alpha})` : `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }

    const steps = 80
    const longs = 12
    const lats = 6

    for (let li = 1; li <= lats; li += 1) {
      const phi = (li / (lats + 1)) * Math.PI - Math.PI / 2
      const r = Math.cos(phi)
      const y = Math.sin(phi)
      const pts: Vec3[] = []
      for (let si = 0; si <= steps; si += 1) {
        const t = (si / steps) * Math.PI * 2
        pts.push({ x: r * Math.cos(t), y, z: r * Math.sin(t) })
      }
      drawPolyline(pts)
    }

    for (let mi = 0; mi < longs; mi += 1) {
      const theta0 = (mi / longs) * Math.PI * 2
      const pts: Vec3[] = []
      for (let si = 0; si <= steps; si += 1) {
        const phi = (si / steps) * Math.PI - Math.PI / 2
        const r = Math.cos(phi)
        const y = Math.sin(phi)
        pts.push({ x: r * Math.cos(theta0), y, z: r * Math.sin(theta0) })
      }
      drawPolyline(pts)
    }

    // Axes.
    const axis = (dir: Vec3, labelText: string) => {
      const a = applyView({ x: 0, y: 0, z: 0 })
      const b = applyView(dir)
      ctx.strokeStyle = border
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()

      ctx.fillStyle = text
      ctx.font = '12px ui-sans-serif, system-ui'
      ctx.fillText(labelText, b.x + 6, b.y + 4)
    }
    axis({ x: 1, y: 0, z: 0 }, '+x')
    axis({ x: 0, y: 1, z: 0 }, '+y')
    axis({ x: 0, y: 0, z: 1 }, '+z')

    // Bloch vector.
    {
      const o = applyView({ x: 0, y: 0, z: 0 })
      const p = applyView(vec)
      ctx.strokeStyle = primary
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(o.x, o.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()

      // Arrow head.
      const dx = p.x - o.x
      const dy = p.y - o.y
      const len = Math.max(1, Math.hypot(dx, dy))
      const ux = dx / len
      const uy = dy / len
      const ah = 10
      const aw = 6
      const hx = p.x - ux * ah
      const hy = p.y - uy * ah
      ctx.fillStyle = primary
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(hx + -uy * aw, hy + ux * aw)
      ctx.lineTo(hx + uy * aw, hy + -ux * aw)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = primarySoft
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [yaw, pitch, x, y, z])

  return (
    <div className="rounded-2xl border border-border glass ring-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag to rotate. x={x.toFixed(3)} y={y.toFixed(3)} z={z.toFixed(3)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setYaw(0.9)
            setPitch(-0.45)
          }}
          className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground hover:bg-muted/70 transition-colors"
        >
          Reset view
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`rounded-xl border border-border bg-background/20 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={(e) => {
            const target = e.currentTarget
            target.setPointerCapture(e.pointerId)
            setDragging(true)
            ;(target as any)._last = { x: e.clientX, y: e.clientY }
          }}
          onPointerMove={(e) => {
            const target = e.currentTarget as any
            const last = target._last
            if (!dragging || !last) return
            const dx = e.clientX - last.x
            const dy = e.clientY - last.y
            target._last = { x: e.clientX, y: e.clientY }
            setYaw((v) => v + dx * 0.01)
            setPitch((v) => clamp(v + dy * 0.01, -1.35, 1.35))
          }}
          onPointerUp={(e) => {
            const target = e.currentTarget as any
            target.releasePointerCapture(e.pointerId)
            setDragging(false)
            target._last = null
          }}
        />
      </div>
    </div>
  )
}
