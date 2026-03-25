'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { updateProfile } from '@/lib/actions/profile'

interface Profile {
  full_name?: string
  handicap_index?: number
  charity_pct?: number
  chosen_charity_id?: string | null
}

type CharityOpt = { id: string; name: string }

export default function ProfileForm({
  profile,
  charities,
}: {
  profile: Profile
  charities: CharityOpt[]
}) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [handicap, setHandicap] = useState(Number(profile.handicap_index ?? 28))
  const [charityPct, setCharityPct] = useState(profile.charity_pct || 10)
  const [charityId, setCharityId] = useState(profile.chosen_charity_id ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      setMsg(null)
      try {
        await updateProfile({
          full_name: fullName,
          handicap_index: handicap,
          charity_pct: charityPct,
          chosen_charity_id: charityId || null,
        })
        setMsg('Saved.')
      } catch (e: unknown) {
        setMsg((e as Error).message)
      }
    })
  }

  return (
    <div className="glass rounded-[2rem] p-8 space-y-8 border-white/5">
      {msg && (
        <p className={`text-sm ${msg === 'Saved.' ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
      )}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Personal details</h3>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Handicap index
            </label>
            <span className="text-xl font-bold text-white">{handicap}</span>
          </div>
          <input
            type="range"
            min={0}
            max={54}
            step={0.1}
            value={handicap}
            onChange={(e) => setHandicap(Number(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="space-y-2 pt-4 border-t border-white/5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Supported charity
          </label>
          <select
            value={charityId}
            onChange={(e) => setCharityId(e.target.value)}
            className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white"
          >
            <option value="">Select…</option>
            {charities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Charity % of subscription
            </label>
            <span className="text-xl font-bold text-emerald-400">{charityPct}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={charityPct}
            onChange={(e) => setCharityPct(Number(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <p className="text-[10px] text-zinc-600 leading-tight">
            Minimum 10% of each subscription payment is donated to your chosen charity (PRD).
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 min-h-[48px]"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isPending ? 'Saving…' : 'Update profile'}
      </button>
    </div>
  )
}
