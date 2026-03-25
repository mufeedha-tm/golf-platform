import { Suspense } from 'react'
import PricingClient from './PricingClient'

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-zinc-500 text-sm">Loading pricing…</div>
      }
    >
      <PricingClient />
    </Suspense>
  )
}
