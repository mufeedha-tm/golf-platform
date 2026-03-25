'use client'

import { useState, useTransition } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { createDonationSession } from '@/lib/actions/donations'

export default function StandaloneDonationForm({
  charityId,
  userId,
}: {
  charityId: string
  userId: string | null
}) {
  const [amount, setAmount] = useState('25')
  const [pending, start] = useTransition()

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        start(async () => {
          await createDonationSession(formData)
        })
      }}
    >
      <input type="hidden" name="charityId" value={charityId} />
      <input type="hidden" name="userId" value={userId ?? 'anonymous'} />
      <label className="block text-sm text-zinc-400">
        Amount ({(process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? 'USD').toUpperCase()})
        <input
          name="amount"
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-2 w-full min-h-[48px] rounded-xl bg-white/5 border border-white/10 px-4 text-white text-base"
          required
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[48px] bg-white text-black py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition disabled:opacity-50"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
        Donate (no subscription required)
      </button>
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        One-time payment via Stripe. Not linked to draws or score entry.
      </p>
    </form>
  )
}
