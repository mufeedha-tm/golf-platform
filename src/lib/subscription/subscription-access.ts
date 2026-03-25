import type { SupabaseClient } from '@supabase/supabase-js'

import { isSubscriptionActiveForAccess } from '@/lib/subscription-status'

export type UserSubscriptionState = {
  active: boolean
  status: string | null
}

export function getUserSubscriptionFromProfileRow(
  profile: { subscription_status?: string | null } | null
): UserSubscriptionState {
  const status = profile?.subscription_status ?? null
  return {
    active: isSubscriptionActiveForAccess(status),
    status,
  }
}

export async function getUserSubscriptionWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscriptionState> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .maybeSingle()

  return getUserSubscriptionFromProfileRow(data)
}
