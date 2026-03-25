'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { createCheckoutSession } from '@/lib/stripe/client'

const FEATURES = [
  'Advanced Stableford Calculator',
  'Unlimited Scorecards & History',
  '1x Entry to Monthly Millionaire Draw',
  '10% of subscription goes to charity of your choice',
  'Exclusive partner discounts',
  'Priority support',
]

const PLANS = {
  monthly: { label: 'Monthly', price: '$19', period: '/mo', savings: null },
  yearly: { label: 'Yearly', price: '$15', period: '/mo', savings: 'Save 21% — $180/yr' },
}

export default function PricingClient() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const canceled = searchParams.get('canceled')

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [isPending, startTransition] = useTransition()

  const plan = PLANS[billing]

  function handleSubscribe() {
    startTransition(async () => {
      await createCheckoutSession(billing)
    })
  }

  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16 px-4">
      {error === 'subscription_required' && (
        <div className="mb-8 max-w-md w-full px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm text-center">
          An active subscription is required to access the dashboard.
        </div>
      )}

      {canceled === 'true' && (
        <div className="mb-8 max-w-md w-full px-4 py-3 rounded-xl bg-zinc-500/10 border border-zinc-500/30 text-zinc-400 text-sm text-center">
          Checkout was cancelled. No charge was made.
        </div>
      )}

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Simple, transparent pricing</h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          One membership unlocks all features, lottery entries, and charitable contribution matching.
        </p>
      </div>

      <div className="flex items-center gap-3 glass rounded-full px-2 py-2 mb-12">
        {(['monthly', 'yearly'] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBilling(b)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              billing === b ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {PLANS[b].label}
            {b === 'yearly' && (
              <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                Save 21%
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="glass max-w-md w-full rounded-3xl p-8 relative overflow-hidden border-white/10 hover:border-primary-500/50 transition-colors duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-semibold">Pro Membership</h2>
            <p className="text-zinc-400 mt-1 text-sm">Everything you need to play and give back.</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold">{plan.price}</span>
            <span className="text-zinc-400 text-sm">{plan.period}</span>
          </div>
        </div>

        {plan.savings && <p className="text-emerald-400 text-sm font-medium mb-6">{plan.savings}</p>}

        <button
          type="button"
          onClick={handleSubscribe}
          disabled={isPending}
          className="w-full glow-btn bg-white text-black py-4 rounded-xl font-semibold mb-8 hover:bg-zinc-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to Stripe…
            </>
          ) : (
            `Subscribe ${plan.label}`
          )}
        </button>

        <div className="space-y-4">
          {FEATURES.map((feature, i) => (
            <div key={i} className="flex gap-3 items-center text-zinc-300">
              <Check className="w-5 h-5 text-primary-500 shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs text-zinc-500 max-w-sm text-center">
        Payments are securely processed by Stripe. You can cancel or change your plan at any time from your account
        settings.
      </p>
    </div>
  )
}
