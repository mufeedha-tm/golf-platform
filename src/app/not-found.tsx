import { HelpCircle, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full space-y-12">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full animate-ambient" />
          <h1 className="text-[12rem] font-black tracking-tighter text-white/5 leading-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <HelpCircle className="w-20 h-20 text-indigo-400 opacity-20" />
          </div>
        </div>
        
        <div className="space-y-3 relative z-10">
          <h2 className="text-4xl font-bold tracking-tight text-white">Lost in the System.</h2>
          <p className="text-zinc-600 font-medium">The requested route does not exist in our current deployment.</p>
        </div>

        <div className="pt-6">
          <Link
            href="/"
            className="glow-btn bg-white text-black px-12 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 w-fit mx-auto"
          >
            <Home className="w-5 h-5" />
            Back to Safety
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
