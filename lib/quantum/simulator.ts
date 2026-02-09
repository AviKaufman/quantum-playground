export type Complex = {
  re: number
  im: number
}

export type StateVector = {
  nQubits: number
  re: Float64Array
  im: Float64Array
}

export type GateOp =
  | { kind: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'; target: number }
  | { kind: 'RX' | 'RY' | 'RZ'; target: number; theta: number }
  | { kind: 'CNOT' | 'CZ'; control: number; target: number }
  | { kind: 'SWAP'; a: number; b: number }
  | { kind: 'MEASURE'; target: number }

export type Circuit = {
  nQubits: number
  steps: GateOp[][]
}

export type BlochVector = {
  x: number
  y: number
  z: number
}

const MAX_SIM_QUBITS = 20

function assertValidQubitCount(nQubits: number) {
  if (!Number.isInteger(nQubits) || nQubits <= 0) {
    throw new Error(`Invalid qubit count: ${nQubits}`)
  }
  if (nQubits > MAX_SIM_QUBITS) {
    throw new Error(`Statevector simulation limited to <= ${MAX_SIM_QUBITS} qubits (got ${nQubits}).`)
  }
}

function maskForQubit(nQubits: number, qubitIndex: number) {
  // UI convention: q0 is the most-significant bit of the computational basis string.
  return 1 << (nQubits - 1 - qubitIndex)
}

function assertQubitIndex(nQubits: number, q: number, label = 'qubit') {
  if (!Number.isInteger(q) || q < 0 || q >= nQubits) {
    throw new Error(`Invalid ${label} index ${q} for nQubits=${nQubits}`)
  }
}

export function zeroState(nQubits: number): StateVector {
  assertValidQubitCount(nQubits)
  const size = 1 << nQubits
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  re[0] = 1
  return { nQubits, re, im }
}

type ComplexMatrix2 = {
  m00: Complex
  m01: Complex
  m10: Complex
  m11: Complex
}

function applySingleQubitMatrix(state: StateVector, target: number, m: ComplexMatrix2) {
  const { nQubits, re, im } = state
  assertQubitIndex(nQubits, target, 'target')
  const mask = maskForQubit(nQubits, target)

  const { m00, m01, m10, m11 } = m

  for (let i = 0; i < re.length; i += 1) {
    if (i & mask) continue
    const j = i | mask

    const aRe = re[i]
    const aIm = im[i]
    const bRe = re[j]
    const bIm = im[j]

    // out0 = m00 * a + m01 * b
    const out0Re = (m00.re * aRe - m00.im * aIm) + (m01.re * bRe - m01.im * bIm)
    const out0Im = (m00.re * aIm + m00.im * aRe) + (m01.re * bIm + m01.im * bRe)

    // out1 = m10 * a + m11 * b
    const out1Re = (m10.re * aRe - m10.im * aIm) + (m11.re * bRe - m11.im * bIm)
    const out1Im = (m10.re * aIm + m10.im * aRe) + (m11.re * bIm + m11.im * bRe)

    re[i] = out0Re
    im[i] = out0Im
    re[j] = out1Re
    im[j] = out1Im
  }
}

export function applyH(state: StateVector, target: number) {
  const s = 1 / Math.sqrt(2)
  applySingleQubitMatrix(state, target, {
    m00: { re: s, im: 0 },
    m01: { re: s, im: 0 },
    m10: { re: s, im: 0 },
    m11: { re: -s, im: 0 },
  })
}

export function applyX(state: StateVector, target: number) {
  applySingleQubitMatrix(state, target, {
    m00: { re: 0, im: 0 },
    m01: { re: 1, im: 0 },
    m10: { re: 1, im: 0 },
    m11: { re: 0, im: 0 },
  })
}

export function applyY(state: StateVector, target: number) {
  applySingleQubitMatrix(state, target, {
    m00: { re: 0, im: 0 },
    m01: { re: 0, im: -1 },
    m10: { re: 0, im: 1 },
    m11: { re: 0, im: 0 },
  })
}

export function applyZ(state: StateVector, target: number) {
  applySingleQubitMatrix(state, target, {
    m00: { re: 1, im: 0 },
    m01: { re: 0, im: 0 },
    m10: { re: 0, im: 0 },
    m11: { re: -1, im: 0 },
  })
}

export function applyS(state: StateVector, target: number) {
  applySingleQubitMatrix(state, target, {
    m00: { re: 1, im: 0 },
    m01: { re: 0, im: 0 },
    m10: { re: 0, im: 0 },
    m11: { re: 0, im: 1 },
  })
}

export function applyT(state: StateVector, target: number) {
  const c = Math.SQRT1_2
  applySingleQubitMatrix(state, target, {
    m00: { re: 1, im: 0 },
    m01: { re: 0, im: 0 },
    m10: { re: 0, im: 0 },
    m11: { re: c, im: c },
  })
}

export function applyRX(state: StateVector, target: number, theta: number) {
  const c = Math.cos(theta / 2)
  const s = Math.sin(theta / 2)
  applySingleQubitMatrix(state, target, {
    m00: { re: c, im: 0 },
    m01: { re: 0, im: -s },
    m10: { re: 0, im: -s },
    m11: { re: c, im: 0 },
  })
}

export function applyRY(state: StateVector, target: number, theta: number) {
  const c = Math.cos(theta / 2)
  const s = Math.sin(theta / 2)
  applySingleQubitMatrix(state, target, {
    m00: { re: c, im: 0 },
    m01: { re: -s, im: 0 },
    m10: { re: s, im: 0 },
    m11: { re: c, im: 0 },
  })
}

export function applyRZ(state: StateVector, target: number, theta: number) {
  const c = Math.cos(theta / 2)
  const s = Math.sin(theta / 2)
  applySingleQubitMatrix(state, target, {
    m00: { re: c, im: -s },
    m01: { re: 0, im: 0 },
    m10: { re: 0, im: 0 },
    m11: { re: c, im: s },
  })
}

export function applyCNOT(state: StateVector, control: number, target: number) {
  const { nQubits, re, im } = state
  assertQubitIndex(nQubits, control, 'control')
  assertQubitIndex(nQubits, target, 'target')
  if (control === target) {
    throw new Error('CNOT control and target must be different.')
  }

  const controlMask = maskForQubit(nQubits, control)
  const targetMask = maskForQubit(nQubits, target)

  for (let i = 0; i < re.length; i += 1) {
    if ((i & controlMask) === 0) continue
    if (i & targetMask) continue
    const j = i | targetMask

    const tmpRe = re[i]
    const tmpIm = im[i]
    re[i] = re[j]
    im[i] = im[j]
    re[j] = tmpRe
    im[j] = tmpIm
  }
}

export function applyCZ(state: StateVector, control: number, target: number) {
  const { nQubits, re, im } = state
  assertQubitIndex(nQubits, control, 'control')
  assertQubitIndex(nQubits, target, 'target')
  if (control === target) {
    throw new Error('CZ control and target must be different.')
  }

  const controlMask = maskForQubit(nQubits, control)
  const targetMask = maskForQubit(nQubits, target)

  for (let i = 0; i < re.length; i += 1) {
    if ((i & controlMask) === 0) continue
    if ((i & targetMask) === 0) continue
    re[i] *= -1
    im[i] *= -1
  }
}

export function applySWAP(state: StateVector, a: number, b: number) {
  const { nQubits, re, im } = state
  assertQubitIndex(nQubits, a, 'a')
  assertQubitIndex(nQubits, b, 'b')
  if (a === b) return

  const maskA = maskForQubit(nQubits, a)
  const maskB = maskForQubit(nQubits, b)

  for (let i = 0; i < re.length; i += 1) {
    const bitA = i & maskA
    const bitB = i & maskB
    if (!!bitA === !!bitB) continue

    const j = i ^ maskA ^ maskB
    if (j < i) continue

    const tmpRe = re[i]
    const tmpIm = im[i]
    re[i] = re[j]
    im[i] = im[j]
    re[j] = tmpRe
    im[j] = tmpIm
  }
}

export function simulateCircuit(circuit: Circuit): StateVector {
  assertValidQubitCount(circuit.nQubits)

  const state = zeroState(circuit.nQubits)
  for (const step of circuit.steps) {
    validateStep(circuit.nQubits, step)
    for (const op of step) {
      applyOp(state, op)
    }
  }
  return state
}

function validateStep(nQubits: number, step: GateOp[]) {
  const touched = new Array<boolean>(nQubits).fill(false)

  for (const op of step) {
    const qs = touchedQubits(op)
    for (const q of qs) {
      assertQubitIndex(nQubits, q)
      if (touched[q]) {
        throw new Error(`Invalid step: multiple ops touch q${q}.`)
      }
      touched[q] = true
    }
  }
}

function touchedQubits(op: GateOp): number[] {
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
      return [op.target]
    case 'CNOT':
    case 'CZ':
      return [op.control, op.target]
    case 'SWAP':
      return [op.a, op.b]
    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

function applyOp(state: StateVector, op: GateOp) {
  switch (op.kind) {
    case 'H':
      return applyH(state, op.target)
    case 'X':
      return applyX(state, op.target)
    case 'Y':
      return applyY(state, op.target)
    case 'Z':
      return applyZ(state, op.target)
    case 'S':
      return applyS(state, op.target)
    case 'T':
      return applyT(state, op.target)
    case 'RX':
      return applyRX(state, op.target, op.theta)
    case 'RY':
      return applyRY(state, op.target, op.theta)
    case 'RZ':
      return applyRZ(state, op.target, op.theta)
    case 'CNOT':
      return applyCNOT(state, op.control, op.target)
    case 'CZ':
      return applyCZ(state, op.control, op.target)
    case 'SWAP':
      return applySWAP(state, op.a, op.b)
    case 'MEASURE':
      // This simulator samples measurements from the final state distribution.
      return undefined
    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

export function probabilities(state: StateVector): Float64Array {
  const p = new Float64Array(state.re.length)
  for (let i = 0; i < p.length; i += 1) {
    const r = state.re[i]
    const ii = state.im[i]
    p[i] = r * r + ii * ii
  }
  return p
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function sampleAllQubits(probs: Float64Array, shots: number, seed: number): Uint32Array {
  const safeShots = Number.isFinite(shots) ? Math.max(0, Math.floor(shots)) : 0
  const counts = new Uint32Array(probs.length)
  if (safeShots === 0 || probs.length === 0) return counts

  const cdf = new Float64Array(probs.length)
  let total = 0
  for (let i = 0; i < probs.length; i += 1) {
    total += probs[i]
    cdf[i] = total
  }
  if (total === 0) return counts

  const rng = mulberry32(seed)
  for (let s = 0; s < safeShots; s += 1) {
    const r = rng() * total
    let lo = 0
    let hi = cdf.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (r <= cdf[mid]) {
        hi = mid
      } else {
        lo = mid + 1
      }
    }
    counts[lo] += 1
  }

  return counts
}

export function blochVector(state: StateVector, qubit: number): BlochVector {
  const { nQubits, re, im } = state
  assertQubitIndex(nQubits, qubit, 'qubit')
  const mask = maskForQubit(nQubits, qubit)

  let rho00 = 0
  let rho11 = 0
  let rho01Re = 0
  let rho01Im = 0

  for (let i = 0; i < re.length; i += 1) {
    if (i & mask) continue
    const j = i | mask

    const aRe = re[i]
    const aIm = im[i]
    const bRe = re[j]
    const bIm = im[j]

    rho00 += aRe * aRe + aIm * aIm
    rho11 += bRe * bRe + bIm * bIm

    // a * conj(b)
    rho01Re += aRe * bRe + aIm * bIm
    rho01Im += aIm * bRe - aRe * bIm
  }

  return {
    x: 2 * rho01Re,
    y: -2 * rho01Im,
    z: rho00 - rho11,
  }
}

export function bitstring(index: number, nQubits: number) {
  return index.toString(2).padStart(nQubits, '0')
}

