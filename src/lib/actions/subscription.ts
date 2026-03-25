'use server'

import { redirect } from 'next/navigation'

import { getPublicAppUrl } from '@/lib/env/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function createBillingPortalSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    redirect('/pricing?error=no_billing_customer')
  }

  const baseUrl = getPublicAppUrl()

  let sessionUrl: string
  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/profile`,
    })
    if (!session.url) {
      redirect('/dashboard/profile?error=billing_portal')
    }
    sessionUrl = session.url
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Billing portal failed'
    redirect(`/dashboard/profile?error=${encodeURIComponent(message)}`)
  }

  redirect(sessionUrl)
}
