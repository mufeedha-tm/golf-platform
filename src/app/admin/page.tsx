import { createClient } from '@/lib/supabase/server'
import { 
  Users, 
  Trophy, 
  Heart, 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  ArrowDownRight,
  PieChart,
  UserCheck,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalSubscribers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active')
  const { data: scores } = await supabase.from('scorecards').select('total_points')
  const { data: payouts } = await supabase.from('payouts').select('amount, status')
  const { data: donations } = await supabase.from('charity_donations').select('amount')
  
  const { calculatePoolInfo } = await import('@/lib/services/draw-service')
  const { totalPool, currentRollover } = await calculatePoolInfo(supabase)

  const { data: lastDraw } = await supabase.from('draw_results').select('*').order('published_at', { ascending: false }).limit(1).single()

  const avgScore = scores?.length
    ? (scores.reduce((sum, s) => sum + (s.total_points || 0), 0) / scores.length).toFixed(1)
    : '0'
  const totalPaidOut = payouts?.reduce((sum, p) => sum + (p.status === 'paid' ? Number(p.amount) : 0), 0) || 0
  const totalCommitted = payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const totalCharity = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0

  const stats = [
    { name: 'Total Players', value: totalUsers || 0, change: '+12%', trend: 'up', icon: Users, color: 'text-indigo-400' },
    { name: 'Active Subs', value: totalSubscribers || 0, change: '+5%', trend: 'up', icon: UserCheck, color: 'text-emerald-400' },
    { name: 'Avg stableford pts', value: avgScore, change: 'Rolling', trend: 'up', icon: BarChart3, color: 'text-cyan-400' },
    { name: 'Active Pool', value: `$${(totalPool + currentRollover).toLocaleString()}`, change: 'Live Est.', trend: 'up', icon: DollarSign, color: 'text-amber-500' },
    { name: 'Total Payouts', value: `$${totalPaidOut.toLocaleString()}`, change: 'Verified', trend: 'up', icon: Trophy, color: 'text-pink-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Management Console</h1>
        <p className="text-zinc-500">Real-time platform analytics and system-wide visibility.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-8 rounded-[2rem] border-white/5 space-y-6 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-4 bg-white/5 rounded-2xl border border-white/10 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${
                stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{stat.name}</p>
              <h2 className="text-3xl font-bold text-white">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] min-h-[400px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <PieChart className="w-5 h-5 text-zinc-500" />
                <h3 className="text-xl font-bold">Prize Distribution Statistics</h3>
              </div>
              <Link href="/admin/draws" className="text-xs font-bold uppercase tracking-widest text-pink-500 hover:text-pink-400 transition flex items-center gap-2">
                Manage Draws <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-6">
               <div className="flex items-end gap-3 h-40">
                  <div className="flex-1 bg-white/5 rounded-t-2xl border-x border-t border-white/5 hover:bg-indigo-400/20 transition-all duration-500 cursor-help" style={{ height: `${Math.min(100, (lastDraw?.match_5_winners || 0) * 10)}%` }}></div>
                  <div className="flex-1 bg-white/5 rounded-t-2xl border-x border-t border-white/5 hover:bg-pink-400/20 transition-all duration-500 cursor-help" style={{ height: `${Math.min(100, (lastDraw?.match_4_winners || 0) * 5)}%` }}></div>
                  <div className="flex-1 bg-white/5 rounded-t-2xl border-x border-t border-white/5 hover:bg-emerald-400/20 transition-all duration-500 cursor-help" style={{ height: `${Math.min(100, (lastDraw?.match_3_winners || 0) * 2)}%` }}></div>
                  <div className="flex-1 bg-white/5 rounded-t-2xl border-x border-t border-white/5 hover:bg-amber-400/20 transition-all duration-500 cursor-help" style={{ height: '55%' }}></div>
               </div>
               <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2">
                  <span>Match 5 ({lastDraw?.match_5_winners || 0})</span>
                  <span>Match 4 ({lastDraw?.match_4_winners || 0})</span>
                  <span>Match 3 ({lastDraw?.match_3_winners || 0})</span>
                  <span>Participation (Avg)</span>
               </div>
               <div className="p-6 bg-black/40 rounded-3xl border border-white/5 mt-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Total Committed Rewards
                    </span>
                    <span className="font-bold text-white">${totalCommitted.toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="glass p-8 rounded-[2.5rem] space-y-8 border-pink-500/10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Impact Analytics
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-4xl font-bold tracking-tighter text-white font-mono">${totalCharity.toLocaleString()}</p>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Lifetime Donations</p>
              </div>
              <div className="space-y-4">
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full w-[100%]" />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-500">Charity Target (Real Time)</span>
                  <span className="text-pink-500">Live Impact</span>
                </div>
              </div>
              <Link href="/admin/charities" className="flex items-center justify-center w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition shadow-2xl shadow-white/5">
                Manage Partners
              </Link>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] space-y-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Quick-Action Panel</h3>
             <div className="grid grid-cols-2 gap-4">
               <Link href="/admin/users" className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition group">
                  <Users className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
                  <p className="text-[10px] font-bold uppercase mt-3 text-zinc-400 group-hover:text-white">Players</p>
               </Link>
               <Link href="/admin/verification" className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition group">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
                  <p className="text-[10px] font-bold uppercase mt-3 text-zinc-400 group-hover:text-white">Pay/Verify</p>
               </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
