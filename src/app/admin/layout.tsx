import { 
  BarChart3, 
  Users, 
  Trophy, 
  Heart, 
  CheckCircle2, 
  Settings, 
  LayoutDashboard,
  LogOut,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { name: 'Analytics', href: '/admin', icon: BarChart3 },
    { name: 'Draw Management', href: '/admin/draws', icon: Trophy },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Charity Partners', href: '/admin/charities', icon: Heart },
    { name: 'Verification', href: '/admin/verification', icon: CheckCircle2 },
  ]

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-72 border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 h-screen flex flex-col p-6 space-y-10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Admin <span className="text-zinc-500">Suite</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-zinc-400 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 group-hover:scale-110 transition" />
                {item.name}
              </div>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition" />
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition text-sm">
            <LayoutDashboard className="w-4 h-4" />
            Switch to Player
          </Link>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition text-sm w-full mt-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-h-screen bg-gradient-to-tr from-zinc-950 to-black overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
