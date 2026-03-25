'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full glass p-12 rounded-[2.5rem] space-y-8 border-red-500/10">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">System Interrupted</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            An unexpected error occurred within the platform mechanics. Our engineers have been notified.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="glow-btn bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Resume Session
          </button>
          <Link
            href="/"
            className="glass px-6 py-4 rounded-2xl text-sm font-bold border-white/5 hover:bg-white/5 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Base
          </Link>
        </div>
      </div>
    </div>
  )
}
