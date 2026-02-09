import { QuantumPlayground } from '@/components/quantum/QuantumPlayground'

export default function HomePage() {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quantum Playground</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold">Interactive quantum circuit sandbox</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Build small circuits, simulate them with a statevector backend, and share seeded measurement results.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            MVP scope: core gates, sampling, and a Bloch vector projection. More gates and noise models are next.
          </p>
        </div>

        <QuantumPlayground />
      </div>
    </div>
  )
}
