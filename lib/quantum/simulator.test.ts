import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyCNOT,
  applyH,
  applyRX,
  applySWAP,
  applyX,
  bitstring,
  blochVector,
  probabilities,
  simulateCircuit,
  zeroState,
  type Circuit,
} from './simulator.ts'

const approxEqual = (a: number, b: number, eps = 1e-9) => {
  assert.ok(Number.isFinite(a) && Number.isFinite(b), 'expected finite numbers')
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ~= ${b}`)
}

test('bitstring uses q0 as MSB', () => {
  assert.equal(bitstring(0, 3), '000')
  assert.equal(bitstring(1, 3), '001')
  assert.equal(bitstring(2, 3), '010')
  assert.equal(bitstring(4, 3), '100')
  assert.equal(bitstring(7, 3), '111')
})

test('H on |0> produces |+>', () => {
  const s = zeroState(1)
  applyH(s, 0)
  const inv = 1 / Math.sqrt(2)
  approxEqual(s.re[0], inv)
  approxEqual(s.im[0], 0)
  approxEqual(s.re[1], inv)
  approxEqual(s.im[1], 0)
})

test('Bell state: (|00> + |11>)/sqrt(2)', () => {
  const s = zeroState(2)
  applyH(s, 0)
  applyCNOT(s, 0, 1)

  const inv = 1 / Math.sqrt(2)
  approxEqual(s.re[0], inv)
  approxEqual(s.im[0], 0)
  approxEqual(s.re[3], inv)
  approxEqual(s.im[3], 0)

  // Other amplitudes ~ 0
  approxEqual(s.re[1], 0)
  approxEqual(s.im[1], 0)
  approxEqual(s.re[2], 0)
  approxEqual(s.im[2], 0)
})

test('GHZ(3): (|000> + |111>)/sqrt(2)', () => {
  const c: Circuit = {
    nQubits: 3,
    steps: [
      [{ kind: 'H', target: 0 }],
      [{ kind: 'CNOT', control: 0, target: 1 }],
      [{ kind: 'CNOT', control: 1, target: 2 }],
    ],
  }
  const s = simulateCircuit(c)
  const inv = 1 / Math.sqrt(2)
  approxEqual(s.re[0], inv)
  approxEqual(s.re[7], inv)
  approxEqual(s.im[0], 0)
  approxEqual(s.im[7], 0)
})

test('RX(pi) on |0> gives -i|1>', () => {
  const s = zeroState(1)
  applyRX(s, 0, Math.PI)
  approxEqual(s.re[0], 0, 1e-9)
  approxEqual(s.im[0], 0, 1e-9)
  approxEqual(s.re[1], 0, 1e-9)
  approxEqual(s.im[1], -1, 1e-9)
})

test('SWAP exchanges qubit values', () => {
  // Start |01> (q0=0, q1=1), then swap -> |10>
  const s = zeroState(2)
  applyX(s, 1)
  applySWAP(s, 0, 1)

  approxEqual(s.re[2], 1)
  approxEqual(s.im[2], 0)
  approxEqual(s.re[1], 0)
  approxEqual(s.re[0], 0)
  approxEqual(s.re[3], 0)
})

test('probabilities sum to 1 (within epsilon)', () => {
  const s = zeroState(2)
  applyH(s, 0)
  applyCNOT(s, 0, 1)
  const p = probabilities(s)
  const sum = Array.from(p).reduce((acc, v) => acc + v, 0)
  approxEqual(sum, 1, 1e-9)
})

test('Bloch vector for |0>, |1>, |+> and Bell reduced state', () => {
  {
    const s = zeroState(1)
    const v = blochVector(s, 0)
    approxEqual(v.x, 0)
    approxEqual(v.y, 0)
    approxEqual(v.z, 1)
  }

  {
    const s = zeroState(1)
    applyX(s, 0)
    const v = blochVector(s, 0)
    approxEqual(v.x, 0)
    approxEqual(v.y, 0)
    approxEqual(v.z, -1)
  }

  {
    const s = zeroState(1)
    applyH(s, 0)
    const v = blochVector(s, 0)
    approxEqual(v.x, 1)
    approxEqual(v.y, 0)
    approxEqual(v.z, 0)
  }

  {
    const s = zeroState(2)
    applyH(s, 0)
    applyCNOT(s, 0, 1)
    const v0 = blochVector(s, 0)
    const v1 = blochVector(s, 1)
    approxEqual(v0.x, 0, 1e-9)
    approxEqual(v0.y, 0, 1e-9)
    approxEqual(v0.z, 0, 1e-9)
    approxEqual(v1.x, 0, 1e-9)
    approxEqual(v1.y, 0, 1e-9)
    approxEqual(v1.z, 0, 1e-9)
  }
})

