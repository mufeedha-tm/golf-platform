import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function requireActiveSubscriptionApi() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single()

  const ok = profile?.subscription_status === 'active' || profile?.role === 'admin'
  if (!ok) {
    return {
      error: NextResponse.json({ success: false, error: 'Subscription required' }, { status: 403 }),
    }
  }
  return { user, profile, supabase }
}
