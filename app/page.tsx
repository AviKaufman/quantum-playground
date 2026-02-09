'use client'

import { QuantumPlayground } from '@/components/quantum/QuantumPlayground'

export default function HomePage() {
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <QuantumPlayground />
      </div>
    </div>
  )
}
