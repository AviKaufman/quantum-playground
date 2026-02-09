'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Copy,
  Eraser,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  bitstring,
  blochVector,
  probabilities,
  sampleAllQubits,
  simulateCircuit,
  type Circuit,
  type GateOp,
} from '@/lib/quantum/simulator'
import { BlochSphere2D } from '@/components/quantum/BlochSphere2D'

type Tool =
  | 'H'
  | 'X'
  | 'Y'
  | 'Z'
  | 'S'
  | 'T'
  | 'CNOT'
  | 'CZ'
  | 'SWAP'
  | 'ERASE'

type PendingTwoQubit =
  | {
    tool: 'CNOT' | 'CZ' | 'SWAP'
    step: number
    qubit: number
  }
  | null

type SharePayloadV1 = {
  v: 1
  circuit: Circuit
  seed: number
  shots: number
}

const MAX_QUBITS = 12
const MAX_STEPS = 48

const createEmptyCircuit = (nQubits: number, steps: number): Circuit => ({
  nQubits,
  steps: Array.from({ length: Math.max(1, steps) }, () => []),
})

const bellPreset = (): Circuit => ({
  nQubits: 2,
  steps: [
    [{ kind: 'H', target: 0 }],
    [{ kind: 'CNOT', control: 0, target: 1 }],
    [],
    [],
  ],
})

const ghz3Preset = (): Circuit => ({
  nQubits: 3,
  steps: [
    [{ kind: 'H', target: 0 }],
    [{ kind: 'CNOT', control: 0, target: 1 }],
    [{ kind: 'CNOT', control: 1, target: 2 }],
    [],
    [],
  ],
})

const swapPreset = (): Circuit => ({
  nQubits: 2,
  steps: [
    [{ kind: 'X', target: 1 }],
    [{ kind: 'SWAP', a: 0, b: 1 }],
    [],
    [],
  ],
})

const presets = [
  { id: 'bell', name: 'Bell state', build: bellPreset },
  { id: 'ghz3', name: 'GHZ (3 qubits)', build: ghz3Preset },
  { id: 'swap', name: 'SWAP demo', build: swapPreset },
  { id: 'empty', name: 'Empty circuit', build: () => createEmptyCircuit(2, 8) },
] as const

const touchesQubit = (op: GateOp, q: number) => {
  switch (op.kind) {
    case 'H':
    case 'X':
    case 'Y':
    case 'Z':
    case 'S':
    case 'T':
    case 'RX':
    case 'RY':
    case 'RZ':
    case 'MEASURE':
      return op.target === q
    case 'CNOT':
    case 'CZ':
      return op.control === q || op.target === q
    case 'SWAP':
      return op.a === q || op.b === q
    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

const cellToken = (step: GateOp[], qubit: number) => {
  for (const op of step) {
    switch (op.kind) {
      case 'H':
      case 'X':
      case 'Y':
      case 'Z':
      case 'S':
      case 'T':
        if (op.target === qubit) return { text: op.kind, variant: 'gate' as const }
        break
      case 'RX':
      case 'RY':
      case 'RZ':
        if (op.target === qubit) return { text: op.kind, variant: 'gate' as const }
        break
      case 'MEASURE':
        if (op.target === qubit) return { text: 'M', variant: 'measure' as const }
        break
      case 'CNOT':
        if (op.control === qubit) return { text: '●', variant: 'control' as const }
        if (op.target === qubit) return { text: 'X', variant: 'target' as const }
        break
      case 'CZ':
        if (op.control === qubit) return { text: '●', variant: 'control' as const }
        if (op.target === qubit) return { text: 'Z', variant: 'target' as const }
        break
      case 'SWAP':
        if (op.a === qubit || op.b === qubit) return { text: '×', variant: 'swap' as const }
        break
      default: {
        const exhaustive: never = op
        return exhaustive
      }
    }
  }
  return null
}

const base64UrlEncode = (value: string) => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const base64UrlDecode = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

const encodeSharePayload = (payload: SharePayloadV1) => base64UrlEncode(JSON.stringify(payload))

const decodeSharePayload = (encoded: string): SharePayloadV1 | null => {
  try {
    const raw = base64UrlDecode(encoded)
    const parsed = JSON.parse(raw) as SharePayloadV1
    if (!parsed || parsed.v !== 1) return null
    if (!parsed.circuit || typeof parsed.circuit.nQubits !== 'number' || !Array.isArray(parsed.circuit.steps)) {
      return null
    }
    if (!Number.isFinite(parsed.seed) || !Number.isFinite(parsed.shots)) return null
    return parsed
  } catch {
    return null
  }
}

const clampInt = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.floor(value)))

export function QuantumPlayground() {
  const [tool, setTool] = useState<Tool>('H')
  const [pending, setPending] = useState<PendingTwoQubit>(null)
  const [circuit, setCircuit] = useState<Circuit>(() => bellPreset())
  const [shots, setShots] = useState(1024)
  const [seed, setSeed] = useState(1337)
  const [blochQubit, setBlochQubit] = useState(0)
  const [status, setStatus] = useState<string | null>(null)

  const selectTool = (nextTool: Tool) => {
    setTool(nextTool)
    setPending(null)
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    const encoded = url.searchParams.get('c')
    if (!encoded) return
    const payload = decodeSharePayload(encoded)
    if (!payload) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCircuit(payload.circuit)
    setShots(payload.shots)
    setSeed(payload.seed)
    setBlochQubit(0)
  }, [])

  const sim = useMemo(() => {
    try {
      const state = simulateCircuit(circuit)
      const probs = probabilities(state)
      return { state, probs, error: null as string | null }
    } catch (error) {
      return {
        state: null,
        probs: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }, [circuit])

  const counts = useMemo(() => {
    if (!sim.probs) return null
    const safeShots = clampInt(shots, 0, 200000)
    const safeSeed = clampInt(seed, 0, 0xffffffff)
    return sampleAllQubits(sim.probs, safeShots, safeSeed)
  }, [sim.probs, shots, seed])

  const topAmplitudes = useMemo(() => {
    if (!sim.state || !sim.probs) return []
    const rows = []
    for (let i = 0; i < sim.probs.length; i += 1) {
      const p = sim.probs[i]
      if (p < 1e-6) continue
      rows.push({
        index: i,
        bits: bitstring(i, circuit.nQubits),
        p,
        re: sim.state.re[i],
        im: sim.state.im[i],
      })
    }
    rows.sort((a, b) => b.p - a.p)
    return rows.slice(0, 20)
  }, [sim.state, sim.probs, circuit.nQubits])

  const histogram = useMemo(() => {
    if (!counts) return []
    const items: { bits: string; count: number }[] = []
    for (let i = 0; i < counts.length; i += 1) {
      const count = counts[i]
      if (!count) continue
      items.push({ bits: bitstring(i, circuit.nQubits), count })
    }
    items.sort((a, b) => b.count - a.count)
    return items.slice(0, 16)
  }, [counts, circuit.nQubits])

  const bloch = useMemo(() => {
    if (!sim.state) return null
    return blochVector(sim.state, blochQubit)
  }, [sim.state, blochQubit])

  const onCellClick = (stepIndex: number, qubitIndex: number) => {
    setStatus(null)

    if (tool === 'ERASE') {
      setPending(null)
      setCircuit((prev) => {
        const steps = prev.steps.map((step, idx) => {
          if (idx !== stepIndex) return step
          return step.filter((op) => !touchesQubit(op, qubitIndex))
        })
        return { ...prev, steps }
      })
      return
    }

    if (tool === 'CNOT' || tool === 'CZ' || tool === 'SWAP') {
      if (!pending || pending.tool !== tool || pending.step !== stepIndex) {
        setPending({ tool, step: stepIndex, qubit: qubitIndex })
        return
      }

      if (pending.qubit === qubitIndex) {
        setPending(null)
        return
      }

      const a = pending.qubit
      const b = qubitIndex
      setPending(null)

      const op: GateOp = tool === 'SWAP'
        ? { kind: 'SWAP', a, b }
        : { kind: tool, control: a, target: b }

      setCircuit((prev) => {
        const steps = prev.steps.map((step, idx) => {
          if (idx !== stepIndex) return step
          const stripped = step.filter((op) => !touchesQubit(op, a) && !touchesQubit(op, b))
          return [...stripped, op]
        })
        return { ...prev, steps }
      })
      return
    }

    // Single-qubit gate toggle.
    const single = tool
    setPending(null)
    setCircuit((prev) => {
      const steps = prev.steps.map((step, idx) => {
        if (idx !== stepIndex) return step
        const hadSame = step.some(
          (op) =>
            (op.kind === single) &&
            ('target' in op ? op.target === qubitIndex : false),
        )
        const stripped = step.filter((op) => !touchesQubit(op, qubitIndex))
        if (hadSame) return stripped
        return [...stripped, { kind: single, target: qubitIndex } as GateOp]
      })
      return { ...prev, steps }
    })
  }

  const addStep = () => {
    setCircuit((prev) => {
      if (prev.steps.length >= MAX_STEPS) return prev
      return { ...prev, steps: [...prev.steps, []] }
    })
  }

  const removeStep = () => {
    setPending(null)
    setCircuit((prev) => {
      if (prev.steps.length <= 1) return prev
      return { ...prev, steps: prev.steps.slice(0, -1) }
    })
  }

  const addQubit = () => {
    setPending(null)
    setCircuit((prev) => {
      if (prev.nQubits >= MAX_QUBITS) return prev
      return { ...prev, nQubits: prev.nQubits + 1 }
    })
  }

  const removeQubit = () => {
    setPending(null)
    setCircuit((prev) => {
      if (prev.nQubits <= 1) return prev
      const removed = prev.nQubits - 1
      const steps = prev.steps.map((step) => step.filter((op) => !touchesQubit(op, removed)))
      return { nQubits: removed, steps }
    })
    setBlochQubit((q) => Math.min(q, circuit.nQubits - 2))
  }

  const clearCircuit = () => {
    setPending(null)
    setCircuit((prev) => ({ ...prev, steps: prev.steps.map(() => []) }))
  }

  const loadPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    setPending(null)
    setCircuit(preset.build())
    setBlochQubit(0)
  }

  const copyShareLink = async () => {
    try {
      const payload: SharePayloadV1 = {
        v: 1,
        circuit,
        seed: clampInt(seed, 0, 0xffffffff),
        shots: clampInt(shots, 0, 200000),
      }
      const encoded = encodeSharePayload(payload)
      const url = new URL(window.location.href)
      url.searchParams.set('c', encoded)
      const share = url.toString()

      await navigator.clipboard.writeText(share)
      setStatus('Copied share link to clipboard.')
    } catch {
      setStatus('Could not copy link. Your browser may block clipboard access.')
    }
  }

  return (
    <div className="mt-10">
      <div className="rounded-lg border border-border bg-muted/10 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              Preset
              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                defaultValue="bell"
                onChange={(e) => loadPreset(e.target.value)}
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addQubit}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
                disabled={circuit.nQubits >= MAX_QUBITS}
                title="Add qubit"
              >
                <Plus className="h-4 w-4" />
                Qubit
              </button>
              <button
                type="button"
                onClick={removeQubit}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                disabled={circuit.nQubits <= 1}
                title="Remove qubit"
              >
                <Trash2 className="h-4 w-4" />
                Qubit
              </button>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                disabled={circuit.steps.length >= MAX_STEPS}
                title="Add step"
              >
                <Plus className="h-4 w-4" />
                Step
              </button>
              <button
                type="button"
                onClick={removeStep}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                disabled={circuit.steps.length <= 1}
                title="Remove step"
              >
                <Trash2 className="h-4 w-4" />
                Step
              </button>
              <button
                type="button"
                onClick={clearCircuit}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
                title="Clear circuit"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              Shots
              <input
                type="number"
                className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                value={shots}
                min={0}
                max={200000}
                onChange={(e) => setShots(Number(e.target.value))}
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              Seed
              <input
                type="number"
                className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                value={seed}
                min={0}
                max={0xffffffff}
                onChange={(e) => setSeed(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              title="Copy share link"
            >
              <Copy className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Statevector simulator. Limit: {MAX_QUBITS} qubits in this UI. Mid-circuit measurement is not implemented yet.
          </p>
          {status && <p className="text-xs text-muted-foreground">{status}</p>}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">Editor</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a tool, then click cells. For two-qubit tools, click control then target (same column).
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ['H', 'H'],
                  ['X', 'X'],
                  ['Y', 'Y'],
                  ['Z', 'Z'],
                  ['S', 'S'],
                  ['T', 'T'],
                  ['CNOT', 'CNOT'],
                  ['CZ', 'CZ'],
                  ['SWAP', 'SWAP'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectTool(id)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    tool === id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => selectTool('ERASE')}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  tool === 'ERASE'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
                title="Erase"
              >
                <Eraser className="h-4 w-4" />
                Erase
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <div
                className="inline-grid gap-0.5"
                style={{
                  gridTemplateColumns: `80px repeat(${circuit.steps.length}, 52px)`,
                  gridTemplateRows: `28px repeat(${circuit.nQubits}, 52px)`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-start text-xs text-muted-foreground px-2">
                  qubit
                </div>
                {circuit.steps.map((_, stepIndex) => (
                  <div
                    key={`h-${stepIndex}`}
                    className="flex items-center justify-center text-[11px] text-muted-foreground"
                  >
                    {stepIndex + 1}
                  </div>
                ))}

                {/* Rows */}
                {Array.from({ length: circuit.nQubits }).map((_, qubitIndex) => (
                  <div key={`row-${qubitIndex}`} className="contents">
                    <div className="flex items-center justify-start px-2 text-xs text-muted-foreground">
                      q{qubitIndex}
                    </div>
                    {circuit.steps.map((step, stepIndex) => {
                      const token = cellToken(step, qubitIndex)
                      const isPending =
                        pending &&
                        pending.step === stepIndex &&
                        pending.qubit === qubitIndex

                      const base =
                        'relative flex h-[52px] w-[52px] items-center justify-center rounded-md border text-sm font-medium transition-colors'

                      const style = token
                        ? token.variant === 'control'
                          ? 'border-border bg-background text-foreground'
                          : token.variant === 'target'
                            ? 'border-border bg-background text-foreground'
                            : token.variant === 'swap'
                              ? 'border-border bg-background text-foreground'
                              : token.variant === 'measure'
                                ? 'border-border bg-background text-foreground'
                                : 'border-border bg-secondary text-secondary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'

                      const ring = isPending ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''

                      return (
                        <button
                          key={`cell-${qubitIndex}-${stepIndex}`}
                          type="button"
                          onClick={() => onCellClick(stepIndex, qubitIndex)}
                          className={`${base} ${style} ${ring}`}
                          aria-label={`q${qubitIndex}, step ${stepIndex + 1}`}
                        >
                          {token ? token.text : ''}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">Results</p>
            {sim.error ? (
              <p className="mt-2 text-sm text-red-500">
                {sim.error}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing the final state distribution and a seeded measurement histogram.
              </p>
            )}
          </div>

          {bloch && (
            <div>
              <label className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                Bloch qubit
                <select
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={blochQubit}
                  onChange={(e) => setBlochQubit(Number(e.target.value))}
                >
                  {Array.from({ length: circuit.nQubits }).map((_, q) => (
                    <option key={q} value={q}>
                      q{q}
                    </option>
                  ))}
                </select>
              </label>
              <BlochSphere2D vector={bloch} />
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">Top amplitudes</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Basis states are shown as bitstrings with q0 on the left.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">|state⟩</th>
                    <th className="py-2 pr-4 font-medium">amplitude</th>
                    <th className="py-2 pr-4 font-medium">prob</th>
                  </tr>
                </thead>
                <tbody>
                  {topAmplitudes.length === 0 ? (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={3}>
                        Run a circuit to see amplitudes.
                      </td>
                    </tr>
                  ) : (
                    topAmplitudes.map((row) => (
                      <tr key={row.bits} className="border-t border-border/60">
                        <td className="py-2 pr-4 font-mono text-xs">{row.bits}</td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          {row.re.toFixed(4)} {row.im < 0 ? '-' : '+'} {Math.abs(row.im).toFixed(4)}i
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{row.p.toFixed(6)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">Measurement histogram (seeded)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {shots} shots using seed {clampInt(seed, 0, 0xffffffff)}.
            </p>

            <div className="mt-4 space-y-2">
              {histogram.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Run a circuit to see counts.
                </p>
              ) : (
                histogram.map((row) => {
                  const frac = shots > 0 ? row.count / shots : 0
                  return (
                    <div key={row.bits} className="grid grid-cols-[72px_1fr_72px] items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{row.bits}</span>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min(1, frac) * 100}%` }}
                        />
                      </div>
                      <span className="text-right font-mono text-xs text-muted-foreground">
                        {row.count}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
