import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function CharityDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('chosen_charity_id, charity_pct')
        .eq('id', user.id)
        .single()
    : { data: null }

  const { data: charity } = profile?.chosen_charity_id
    ? await supabase.from('charities').select('*').eq('id', profile.chosen_charity_id).single()
    : { data: null }

  const { data: myDonations } = user
    ? await supabase.from('charity_donations').select('amount').eq('user_id', user.id)
    : { data: [] }

  const myTotal =
    myDonations?.reduce((s, r) => s + Number(r.amount), 0) ?? 0

  const { data: allDonations } = await supabase.from('charity_donations').select('amount')
  const communityTotal = allDonations?.reduce((s, r) => s + Number(r.amount), 0) ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Charity impact</h1>
          <p className="text-zinc-400 mt-1">
            Your subscription share and any standalone gifts — transparent totals from the database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="glass p-8 rounded-2xl">
          <h3 className="text-zinc-400 text-sm font-medium mb-2">Your recorded donations</h3>
          <span className="text-5xl font-bold tracking-tighter text-emerald-400">
            ${myTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <p className="text-zinc-500 mt-4 text-sm">
            From subscription-linked rows and independent checkout in{' '}
            <Link href="/charities" className="text-pink-400 underline underline-offset-2">
              charities
            </Link>
            .
          </p>
        </div>

        <div className="glass p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-zinc-400 text-sm font-medium mb-2">Community total (all users)</h3>
          <span className="text-5xl font-bold tracking-tighter text-white">
            ${communityTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <p className="text-zinc-500 mt-4 text-sm">Every recorded donation row across the platform.</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-medium mb-4">Your selected charity</h2>
        {charity ? (
          <div className="glass p-6 rounded-2xl border-emerald-500/30 bg-emerald-500/5">
            <h3 className="font-semibold text-lg text-white mb-1">{charity.name}</h3>
            <p className="text-zinc-400 text-sm mb-4">{charity.description}</p>
            <p className="text-sm text-emerald-400 font-medium">
              You route {profile?.charity_pct ?? 10}% of each subscription payment to this organisation (minimum 10%).
            </p>
            <Link
              href={`/charities/${charity.id}`}
              className="inline-block mt-4 text-sm font-bold text-white hover:text-pink-400"
            >
              View charity profile →
            </Link>
          </div>
        ) : (
          <div className="glass p-6 rounded-2xl border-white/10">
            <p className="text-zinc-400 text-sm mb-4">You have not selected a charity yet.</p>
            <Link href="/login" className="text-pink-400 font-bold text-sm">
              Complete signup / profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
