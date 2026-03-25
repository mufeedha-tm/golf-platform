import { createClient } from '@/lib/supabase/server'
import { Trophy, Clock, ArrowRight, CheckCircle } from 'lucide-react'
import ProofUpload from '@/components/lottery/ProofUpload'
import { calculatePoolInfo } from '@/lib/services/draw-service'

export default async function LotteryPage() {
  const supabase = await createClient()
  const { totalPool, currentRollover } = await calculatePoolInfo(supabase)
  const jackpotDisplay = totalPool + currentRollover

  const { data: upcoming } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true, nullsFirst: false })
    .order('draw_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { data: lastCompleted } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'completed')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: lastResult } = await supabase
    .from('draw_results')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('subscription_status').eq('id', user.id).single()
    : { data: null }

  const { count: scoreCount } = user
    ? await supabase
        .from('scorecards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
    : { count: 0 }

  let entriesCount = 0
  if (user && upcoming?.id) {
    const { count } = await supabase
      .from('draw_entries')
      .select('*', { count: 'exact', head: true })
      .eq('draw_id', upcoming.id)
      .eq('user_id', user.id)
    entriesCount = count ?? 0
  }

  const participatesBySubscription =
    profile?.subscription_status === 'active' && (scoreCount ?? 0) > 0

  const { data: payout } = user
    ? await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const isWinner = !!payout

  const when = upcoming?.scheduled_for
    ? new Date(upcoming.scheduled_for)
    : upcoming?.draw_date
      ? new Date(`${upcoming.draw_date}T12:00:00`)
      : null
  const whenLabel = when && !Number.isNaN(when.getTime()) ? when.toLocaleDateString() : 'TBC'

  const nums = lastCompleted?.winning_numbers
  const winningNums = Array.isArray(nums) ? (nums as number[]) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full space-y-16">
      <section className="relative rounded-[2.5rem] overflow-hidden glass p-8 sm:p-12 lg:p-20 flex flex-col items-center text-center space-y-6 sm:space-y-8 min-h-[360px] sm:min-h-[500px] justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-transparent to-transparent opacity-50" />

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            Next draw: {whenLabel}
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white">
            ${jackpotDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
            <span className="text-zinc-600 block text-2xl sm:text-4xl mt-4">Prize pool (funded + rollover)</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center relative z-10">
          {(winningNums.length ? winningNums : [0, 0, 0, 0, 0]).slice(0, 5).map((n, i) => (
            <div
              key={i}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl sm:text-3xl font-bold"
            >
              {winningNums.length ? n : '—'}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 relative z-10 max-w-md">
          {winningNums.length
            ? `Last published winning numbers (read-only).`
            : `No completed draw with numbers yet.`}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Winner verification</h2>

            {!isWinner ? (
              <div className="glass p-8 sm:p-12 rounded-3xl text-center space-y-6 border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8 text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-500">No payout on file</h3>
                  <p className="text-zinc-600 max-w-sm mx-auto text-sm">
                    Proof upload unlocks when the system records a prize for your account after a draw.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="glass p-6 sm:p-8 rounded-3xl bg-pink-500/5 border-pink-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-pink-500 uppercase tracking-widest">Congratulations</p>
                    <h3 className="text-2xl font-bold">Match {payout.tier} tier</h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-bold">${Number(payout.amount).toLocaleString()}</p>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest mt-1 ${
                        payout.payment_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      Payment: {payout.payment_status ?? 'pending'}
                    </p>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">
                      Proof: {payout.status}
                    </p>
                  </div>
                </div>

                {payout.status === 'pending' && !payout.proof_url && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="w-5 h-5 text-pink-500" />
                      <h3 className="text-xl font-bold">Upload proof</h3>
                    </div>
                    <p className="text-zinc-400 leading-relaxed text-sm">
                      Screenshot of scores from your official golf platform (PRD). Our team will approve or reject within
                      24–48 hours.
                    </p>
                    <ProofUpload payoutId={payout.id} />
                  </div>
                )}

                {payout.status === 'pending' && payout.proof_url && (
                  <div className="glass p-8 rounded-3xl flex items-center gap-6 border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle className="w-10 h-10 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg">Proof received</h4>
                      <p className="text-sm text-zinc-400">
                        When admin marks the payout paid, your status will show paid here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold">Participation summary</h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center gap-4">
                <span className="text-zinc-500">Draw entries (this cycle)</span>
                <span className="text-white font-bold text-right">
                  {entriesCount > 0 ? `${entriesCount} ticket(s)` : participatesBySubscription ? 'Included*' : '—'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 leading-tight">
                *Active subscribers with at least one stored score are represented in the monthly draw pool (engine uses
                your latest five Stableford totals).
              </p>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Scores on file</span>
                <span className="text-white font-bold">{scoreCount ?? 0}</span>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Subscription</span>
                  <div
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                      profile?.subscription_status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {profile?.subscription_status ?? '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-6 sm:p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold">Last draw stats</h3>
            <div className="space-y-4 text-sm">
              {lastResult ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Match 5 winners</span>
                    <span className="text-white font-bold">{lastResult.match_5_winners ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Match 4 winners</span>
                    <span className="text-white font-bold">{lastResult.match_4_winners ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Match 3 winners</span>
                    <span className="text-white font-bold">{lastResult.match_3_winners ?? 0}</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 pt-2">
                    Published {new Date(lastResult.published_at).toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-zinc-600 text-sm">No draw results published yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
