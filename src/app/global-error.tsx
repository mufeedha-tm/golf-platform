'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full glass p-10 rounded-[2rem] space-y-6 border-red-500/20 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-bold">Application error</h1>
          <p className="text-sm text-zinc-500">
            Something went wrong at the root. Try again or contact support if it persists.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
