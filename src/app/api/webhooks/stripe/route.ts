import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripe } from '@/lib/stripe'
import { logEvent } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { syncSubscriptionAndProfile } from '@/lib/stripe/subscription-sync'

export const runtime = 'nodejs'

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET')
  }
  return secret
}

function subscriptionIdFromInvoice(inv: Stripe.Invoice): string | null {
  const sub = (inv as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription
  if (typeof sub === 'string') return sub
  if (sub && typeof sub === 'object' && 'id' in sub) return (sub as Stripe.Subscription).id
  return null
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = (await headers()).get('stripe-signature')
  if (!signature) {
    await logEvent('error', 'Stripe webhook: missing Stripe-Signature header', {}, 'error')
    return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret())
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    await logEvent('error', `Stripe webhook signature: ${message}`, {}, 'error')
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  const { error: idemError } = await supabaseAdmin
    .from('stripe_webhook_events')
    .insert({ stripe_event_id: event.id })

  if (idemError) {
    if (idemError.code === '23505') {
      await logEvent('payment', `Stripe webhook duplicate event ignored: ${event.id}`, { eventId: event.id })
      return new NextResponse(null, { status: 200 })
    }
    await logEvent('error', `Stripe webhook idempotency insert failed: ${idemError.message}`, { eventId: event.id }, 'error')
    return NextResponse.json({ success: false, error: 'Idempotency store failed' }, { status: 500 })
  }

  await logEvent('payment', `Received Stripe event: ${event.type}`, { eventId: event.id })

  const stripe = getStripe()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata ?? {}

      if (metadata.type === 'donation') {
        const amount = (session.amount_total ?? 0) / 100
        const charityId = metadata.charityId
        const donationUserId =
          !metadata.userId || metadata.userId === 'anonymous' ? null : metadata.userId

        if (charityId && amount > 0) {
          await supabaseAdmin.from('charity_donations').insert({
            charity_id: charityId,
            user_id: donationUserId,
            amount,
            source_type: 'individual',
          })

          await logEvent('payment', `Standalone donation received: $${amount}`, {
            charityId,
            userId: donationUserId,
          })
        }
      } else {
        const userId = metadata.userId
        const subId = session.subscription
        if (userId && typeof subId === 'string') {
          const sub = await stripe.subscriptions.retrieve(subId)
          const result = await syncSubscriptionAndProfile(sub)
          if (result.ok) {
            const { data: user } = await supabaseAdmin
              .from('profiles')
              .select('email')
              .eq('id', result.userId)
              .single()
            if (user?.email) {
              await import('@/lib/email').then((m) =>
                m.sendEmail({
                  to: user.email,
                  subject: 'Welcome to Premium! ⛳️',
                  html:
                    '<h1>Subscription confirmed</h1><p>You are now a premium member of Golf SaaS. Good luck in this month\'s draw!</p>',
                })
              )
            }
          } else {
            await logEvent('error', 'checkout.session.completed: could not resolve user for subscription', {
              eventId: event.id,
              subscriptionId: subId,
            })
          }
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = subscriptionIdFromInvoice(invoice)
      if (!subscriptionId) {
        return new NextResponse(null, { status: 200 })
      }

      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      const result = await syncSubscriptionAndProfile(sub)
      if (!result.ok) {
        await logEvent('payment', 'invoice.payment_succeeded: no user linked to subscription', {
          subscriptionId,
          eventId: event.id,
        })
        return new NextResponse(null, { status: 200 })
      }

      const userId = result.userId
      const amountPaid = (invoice.amount_paid ?? 0) / 100

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('charity_pct, chosen_charity_id')
        .eq('id', userId)
        .single()

      const charityPct = profile?.charity_pct || 10
      const charityAmount = amountPaid * (charityPct / 100)
      const poolAddition = amountPaid - charityAmount

      if (profile?.chosen_charity_id) {
        await supabaseAdmin.from('charity_donations').insert({
          charity_id: profile.chosen_charity_id,
          user_id: userId,
          amount: charityAmount,
          source_type: 'subscription',
        })
      }

      const { data: currentSettings } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'current_prize_pool')
        .single()

      const currentPool = Number(currentSettings?.value || 0)
      await supabaseAdmin.from('system_settings').upsert({
        key: 'current_prize_pool',
        value: currentPool + poolAddition,
        updated_at: new Date().toISOString(),
      })

      await logEvent(
        'payment',
        `Processed subscription invoice: pool +$${poolAddition.toFixed(2)}, charity +$${charityAmount.toFixed(2)}`,
        { userId }
      )
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const result = await syncSubscriptionAndProfile(sub)
      if (!result.ok) {
        await logEvent('payment', 'customer.subscription.updated: no user resolved', {
          subscriptionId: sub.id,
          eventId: event.id,
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const result = await syncSubscriptionAndProfile(sub)
      if (!result.ok) {
        await logEvent('payment', 'customer.subscription.deleted: no user resolved', {
          subscriptionId: sub.id,
          eventId: event.id,
        })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed'
    console.error('Stripe webhook logic error:', err)
    await logEvent('error', `Stripe webhook: ${message}`, { eventId: event.id }, 'error')
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
