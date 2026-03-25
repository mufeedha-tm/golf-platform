import { createClient } from '@/lib/supabase/server'
import { 
  Trophy, 
  CreditCard, 
  Heart, 
  History, 
  CheckCircle2, 
  ArrowUpRight, 
  Clock, 
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, chosen_charity_id')
    .eq('id', user?.id)
    .single()

  const { data: scores } = await supabase
    .from('scorecards')
    .select('*')
    .eq('user_id', user?.id)
    .order('played_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  const { data: charity } = await supabase
    .from('charities')
    .select('name, logo_url')
    .eq('id', profile?.chosen_charity_id)
    .single()

  const totalWinnings = payouts?.reduce((sum, p) => sum + (p.status === 'paid' ? Number(p.amount) : 0), 0) || 0
  const pendingPayout = payouts?.find(p => p.status === 'pending' || p.status === 'approved')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
  
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Player Overview</h1>
          <p className="text-zinc-500 mt-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'}. Here is your current standing.</p>
        </div>
        <div className="flex items-center gap-3 glass px-6 py-3 rounded-2xl border-white/5 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest text-emerald-400">System Live</span>
          <span className="text-zinc-600">|</span>
          <span className="text-sm text-zinc-400">Next Draw in 7 Days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       
        <div className="lg:col-span-1 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="flex justify-between items-start mb-10">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <CreditCard className="w-6 h-6 text-indigo-400" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                profile?.subscription_status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {profile?.subscription_status}
              </span>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Pricing Plan</h3>
              <p className="text-3xl font-bold capitalize">{profile?.subscription_plan || 'No Plan'}</p>
              <div className="flex items-center gap-2 text-zinc-400 text-sm pt-4">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Entered into Monthly Draw</span>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] bg-pink-500/[0.03] border-pink-500/5 group">
            <div className="flex justify-between items-start mb-8">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <Link href="/dashboard/charity" className="p-2 hover:bg-white/5 rounded-full transition">
                <ArrowUpRight className="w-5 h-5 text-zinc-500" />
              </Link>
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">Legacy Contribution</p>
                <h3 className="text-2xl font-bold">{profile?.charity_pct || 10}% <span className="text-sm text-zinc-600 font-medium">of sub price</span></h3>
              </div>
              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={charity?.logo_url || 'https://via.placeholder.com/40'}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover grayscale opacity-50"
                />
                <div>
                  <p className="text-sm font-bold">{charity?.name || 'Charity name'}</p>
                  <p className="text-[10px] text-zinc-500">Selected Partner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] overflow-hidden min-h-[460px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-zinc-500" />
                <h3 className="text-xl font-bold">Stableford Index</h3>
              </div>
              <Link href="/dashboard/scores" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-2 group">
                Log New Score
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </Link>
            </div>

            <div className="space-y-4">
              {scores && scores.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <th className="pb-4">Course</th>
                        <th className="pb-4">Date</th>
                        <th className="pb-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {scores.map((s) => (
                        <tr key={s.id} className="group cursor-default">
                          <td className="py-5 font-medium group-hover:text-indigo-400 transition-colors">{s.course_name}</td>
                          <td className="py-5 text-zinc-500 text-sm">{format(new Date(s.played_at), 'MMM d, yyyy')}</td>
                          <td className="py-5 text-right">
                            <span className="text-lg font-bold text-white px-3 py-1 bg-white/5 rounded-lg border border-white/5 ring-4 ring-white/0 group-hover:ring-white/5 transition-all">
                              {s.total_points}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-zinc-600 space-y-4 border border-dashed border-white/5 rounded-3xl mt-4">
                   <Clock className="w-10 h-10 opacity-20" />
                   <p className="text-sm">No scores recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
            <div className="glass p-8 rounded-[2.5rem] bg-emerald-500/[0.03] border-emerald-500/5 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-6">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Trophy className="w-6 h-6 text-emerald-400" />
                </div>
                {pendingPayout && (
                  <Link href="/dashboard/lottery" className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">
                    Proof Required
                  </Link>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Total Winnings</p>
                <p className="text-3xl font-bold">${totalWinnings.toLocaleString()}</p>
                <div className="flex items-center gap-2 text-zinc-500 text-xs mt-4">
                  <TrendingUp className="w-3 h-3" />
                  <span>3 Total prize matches detected</span>
                </div>
              </div>
            </div>

            <div className="glass p-8 rounded-[2.5rem] flex flex-col justify-between group">
               <div className="space-y-4">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Draw Entry</p>
                  <p className="text-lg font-bold">5 Registered Tickets</p>
                  <p className="text-sm text-zinc-500">Auto-created for March draw based on active {profile?.subscription_plan} plan.</p>
               </div>
               <Link href="/dashboard/lottery" className="text-white text-sm font-semibold flex items-center justify-between mt-6 hover:text-indigo-400 transition">
                 Draw Details <ArrowUpRight className="w-4 h-4" />
               </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
