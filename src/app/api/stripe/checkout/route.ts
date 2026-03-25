import { NextResponse } from 'next/server'
import { getPublicAppUrl } from '@/lib/env/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getPriceIdForPlan } from '@/lib/stripe/price-ids'
import { logEvent } from '@/lib/logger'

export const runtime = 'nodejs'

type Body = {
  userId?: string
  plan?: string
}

export async function POST(req: Request) {
  try {
    let body: Body = {}
    try {
      body = (await req.json()) as Body
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const plan = body.plan === 'yearly' ? 'yearly' : 'monthly'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (body.userId && body.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'userId does not match session' }, { status: 403 })
    }

    const priceId = getPriceIdForPlan(plan)
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    const stripe = getStripe()
    let customerId = profile?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const baseUrl = getPublicAppUrl() || req.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
    })

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Stripe did not return a checkout URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    await logEvent('error', `Stripe checkout: ${message}`, {}, 'error')
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
