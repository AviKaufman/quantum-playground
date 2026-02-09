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
    <div className={embedded ? 'rounded-xl border border-border/70 bg-background/25 p-4' : 'rounded-2xl border border-border glass ring-soft p-5'}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Operator matrix</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {operator === 'ERASE' ? 'Erase clears gates from a cell.' : 'Selected tool shown in canonical form.'}
          </p>
          {helper && (
            <p className="mt-1 text-xs text-muted-foreground">
              {helper}
            </p>
          )}
        </div>
        <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          {operator}
        </span>
      </div>

      {model ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">{model.title}</p>
            {model.subtitle && (
              <p className="text-xs text-muted-foreground">{model.subtitle}</p>
            )}
          </div>

          {model.basis && (
            <p className="mt-2 text-xs text-muted-foreground">
              Basis order: {model.basis.join(', ')}
            </p>
          )}

          <div
            className={`mt-3 grid gap-1 ${model.dim === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}
            aria-label="Operator matrix"
          >
            {model.cells.flatMap((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-lg border border-border/70 bg-background/25 px-2 py-1 text-center font-mono text-[11px] text-foreground/90"
                >
                  {cell}
                </div>
              )),
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-border/70 bg-background/25 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Tip: use <span className="font-medium text-foreground">Erase</span> to remove a gate from a cell without changing other qubits in that step.
          </p>
        </div>
      )}
    </div>
  )
}
