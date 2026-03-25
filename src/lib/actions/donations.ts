'use server'

import { redirect } from 'next/navigation'

import { getPublicAppUrl } from '@/lib/env/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function createDonationSession(formData: FormData) {
  const charityId = String(formData.get('charityId') ?? '')
  const userIdRaw = String(formData.get('userId') ?? 'anonymous')
  const amountStr = String(formData.get('amount') ?? '0')
  const amount = Number(amountStr)

  if (!charityId) throw new Error('Charity is required')
  if (!Number.isFinite(amount) || amount < 1) throw new Error('Invalid amount')

  const supabase = await createClient()
  const { data: charity } = await supabase.from('charities').select('id, name').eq('id', charityId).single()
  if (!charity) throw new Error('Charity not found')

  const baseUrl = getPublicAppUrl()
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? 'usd').toLowerCase(),
          product_data: {
            name: `Donation — ${charity.name}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/charities/${charityId}?donation=success`,
    cancel_url: `${baseUrl}/charities/${charityId}?donation=canceled`,
    metadata: {
      type: 'donation',
      charityId,
      userId: userIdRaw === 'anonymous' ? 'anonymous' : userIdRaw,
    },
  })

  if (!session.url) throw new Error('Stripe did not return a URL')
  redirect(session.url)
}
