import Link from 'next/link'
import { LayoutDashboard, FileSpreadsheet, Ticket, HeartHandshake, User, Lock } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

export default function DashboardShell({
  children,
  canEnterScores,
  displayName,
}: {
  children: ReactNode
  canEnterScores: boolean
  displayName: string | null
}) {
  const initial = (displayName?.trim().charAt(0) || 'M').toUpperCase()

  const lockWrap = (href: string, label: string, Icon: ComponentType<{ className?: string }>, enabled: boolean) => {
    const base =
      'flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors'
    if (!enabled) {
      return (
        <div
          className={`${base} text-zinc-600 cursor-not-allowed border border-white/5`}
          title="Active subscription required"
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="flex-1">{label}</span>
          <Lock className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
        </div>
      )
    }
    return (
      <Link href={href} className={`${base} text-zinc-400 hover:text-white hover:bg-white/5`}>
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden flex-col md:flex-row min-h-0">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-black/50 flex flex-row md:flex-col overflow-x-auto md:overflow-visible shrink-0">
        <div className="p-4 md:p-6 min-w-0 flex-1">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 md:mb-4 hidden md:block">
            Menu
          </p>
          <nav className="flex md:flex-col gap-1 md:gap-2 md:space-y-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/15 transition-colors whitespace-nowrap md:w-full"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" /> Overview
            </Link>
            {lockWrap('/dashboard/scores', 'Log Score', FileSpreadsheet, canEnterScores)}
            {lockWrap('/dashboard/lottery', 'Monthly Draw', Ticket, canEnterScores)}
            <Link
              href="/dashboard/charity"
              className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap md:w-full"
            >
              <HeartHandshake className="w-4 h-4 shrink-0" /> Charity Impact
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap md:w-full"
            >
              <User className="w-4 h-4 shrink-0" /> My Profile
            </Link>
          </nav>
        </div>

        <div className="hidden md:block mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName || 'Member'}</p>
              <p className="text-xs text-zinc-500">
                {canEnterScores ? 'Full access' : 'Browse only — subscribe to play'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-black min-h-0">{children}</main>
    </div>
  )
}
