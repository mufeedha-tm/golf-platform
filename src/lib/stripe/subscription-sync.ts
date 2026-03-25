import 'server-only'
import type Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { mapStripeStatusToProfile } from '@/lib/subscription-status'

type SubscriptionBilling = Stripe.Subscription & {
  current_period_end: number
  cancel_at_period_end: boolean
}

function asBillingSub(sub: Stripe.Subscription): SubscriptionBilling {
  return sub as unknown as SubscriptionBilling
}

function planFromMetadata(metadata: Stripe.Metadata | null | undefined): 'monthly' | 'yearly' {
  return metadata?.plan === 'yearly' ? 'yearly' : 'monthly'
}

function amountFromSubscription(sub: Stripe.Subscription): number {
  const unit = sub.items.data[0]?.price?.unit_amount
  return typeof unit === 'number' ? unit / 100 : 0
}

function customerIdFromSubscription(sub: Stripe.Subscription): string | null {
  const c = sub.customer
  if (typeof c === 'string') return c
  return c && typeof c === 'object' && 'id' in c ? (c as { id: string }).id : null
}

export async function resolveUserIdForSubscription(
  sub: Stripe.Subscription
): Promise<string | null> {
  const metaUid = sub.metadata?.userId
  if (metaUid) return metaUid
  const customerId = customerIdFromSubscription(sub)
  if (!customerId) return null
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}

export async function upsertSubscriptionRowFromStripe(
  sub: Stripe.Subscription,
  userId: string
): Promise<void> {
  const b = asBillingSub(sub)
  const customerId = customerIdFromSubscription(sub)
  if (!customerId) return

  const plan = planFromMetadata(sub.metadata)
  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    plan,
    amount: amountFromSubscription(sub),
    currency: sub.items.data[0]?.price?.currency ?? 'usd',
    current_period_end: new Date(b.current_period_end * 1000).toISOString(),
    cancel_at_period_end: b.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(row, { onConflict: 'stripe_subscription_id' })

  if (error) throw error
}

export async function syncProfileFromStripeSubscription(
  sub: Stripe.Subscription,
  userId: string
): Promise<void> {
  const b = asBillingSub(sub)
  const customerId = customerIdFromSubscription(sub)
  if (!customerId) return

  const profileStatus = mapStripeStatusToProfile(sub.status)
  const plan = planFromMetadata(sub.metadata)

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: profileStatus,
      stripe_customer_id: customerId,
      subscription_plan: plan,
      subscription_ends_at: new Date(b.current_period_end * 1000).toISOString(),
      cancel_at_period_end: b.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

export async function syncSubscriptionAndProfile(
  sub: Stripe.Subscription
): Promise<{ ok: true; userId: string } | { ok: false; reason: 'no_user' }> {
  const userId = await resolveUserIdForSubscription(sub)
  if (!userId) return { ok: false, reason: 'no_user' }

  await upsertSubscriptionRowFromStripe(sub, userId)
  await syncProfileFromStripeSubscription(sub, userId)
  return { ok: true, userId }
}
