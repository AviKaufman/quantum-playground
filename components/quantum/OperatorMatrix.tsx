'use client'

type ComplexToken = string

type MatrixModel = {
  dim: 2 | 4
  basis?: string[]
  title: string
  subtitle?: string
  cells: ComplexToken[][]
}

export type OperatorId = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'CZ' | 'SWAP' | 'ERASE'

const SQRT1_2 = '1/√2'
const EIPIO4 = 'e^{iπ/4}'

function formatMatrix(cells: string[][]) {
  const cols = cells[0]?.length ?? 0
  const widths = new Array<number>(cols).fill(0)
  for (const row of cells) {
    for (let c = 0; c < cols; c += 1) {
      widths[c] = Math.max(widths[c], (row[c] ?? '').length)
    }
  }

  const lines: string[] = []
  for (let r = 0; r < cells.length; r += 1) {
    const row = cells[r]
    const padded = row.map((v, c) => (v ?? '').padStart(widths[c], ' '))
    lines.push(`[ ${padded.join('  ')} ]`)
  }
  return lines.join('\n')
}

const matrixForOperator = (op: OperatorId): MatrixModel | null => {
  switch (op) {
    case 'H':
      return {
        dim: 2,
        title: 'Hadamard (H)',
        cells: [
          [SQRT1_2, SQRT1_2],
          [SQRT1_2, `-${SQRT1_2}`],
        ],
      }
    case 'X':
      return {
        dim: 2,
        title: 'Pauli-X (X)',
        cells: [
          ['0', '1'],
          ['1', '0'],
        ],
      }
    case 'Y':
      return {
        dim: 2,
        title: 'Pauli-Y (Y)',
        cells: [
          ['0', '-i'],
          ['i', '0'],
        ],
      }
    case 'Z':
      return {
        dim: 2,
        title: 'Pauli-Z (Z)',
        cells: [
          ['1', '0'],
          ['0', '-1'],
        ],
      }
    case 'S':
      return {
        dim: 2,
        title: 'Phase (S)',
        subtitle: 'diag(1, i)',
        cells: [
          ['1', '0'],
          ['0', 'i'],
        ],
      }
    case 'T':
      return {
        dim: 2,
        title: 'T gate (T)',
        subtitle: `diag(1, ${EIPIO4})`,
        cells: [
          ['1', '0'],
          ['0', EIPIO4],
        ],
      }
    case 'CZ':
      return {
        dim: 4,
        title: 'Controlled-Z (CZ)',
        subtitle: 'Canonical 2-qubit matrix (control q0, target q1)',
        basis: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
        cells: [
          ['1', '0', '0', '0'],
          ['0', '1', '0', '0'],
          ['0', '0', '1', '0'],
          ['0', '0', '0', '-1'],
        ],
      }
    case 'CNOT':
      return {
        dim: 4,
        title: 'Controlled-NOT (CNOT)',
        subtitle: 'Canonical 2-qubit matrix (control q0, target q1)',
        basis: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
        cells: [
          ['1', '0', '0', '0'],
          ['0', '1', '0', '0'],
          ['0', '0', '0', '1'],
          ['0', '0', '1', '0'],
        ],
      }
    case 'SWAP':
      return {
        dim: 4,
        title: 'SWAP',
        subtitle: 'Canonical 2-qubit matrix',
        basis: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
        cells: [
          ['1', '0', '0', '0'],
          ['0', '0', '1', '0'],
          ['0', '1', '0', '0'],
          ['0', '0', '0', '1'],
        ],
      }
    case 'ERASE':
      return null
    default: {
      const exhaustive: never = op
      return exhaustive
    }
  }
}

export function OperatorMatrix({
  operator,
  helper,
  embedded = false,
}: {
  operator: OperatorId
  helper?: string
  embedded?: boolean
}) {
  const model = matrixForOperator(operator)

  return (
    <div
      className={
        embedded
          ? 'rounded-xl border border-border/70 bg-background/25 p-4'
          : 'rounded-2xl border border-border glass ring-soft p-5'
      }
    >
      <p className="text-sm font-medium">Operator</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{operator}</span>
      </p>
      {helper && (
        <p className="mt-1 text-xs text-muted-foreground">
          {helper}
        </p>
      )}

      {model ? (
        <div className="mt-4">
          <p className="text-sm font-medium">{model.title}</p>
          {model.subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{model.subtitle}</p>
          )}
          {model.basis && (
            <p className="mt-1 text-xs text-muted-foreground">
              Basis: {model.basis.join(', ')}
            </p>
          )}

          <pre
            className="mt-3 overflow-x-auto rounded-xl border border-border/70 bg-background/20 px-4 py-3 font-mono text-[12px] leading-5 text-foreground/90"
            aria-label="Operator matrix"
          >
{`${operator} =\n${formatMatrix(model.cells)}`}
          </pre>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-border/70 bg-background/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Erase removes gates from a cell.
          </p>
        </div>
      )}
    </div>
  )
}
