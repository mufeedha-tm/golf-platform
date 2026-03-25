import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at, cancel_at_period_end, currency, country_code, role')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      userId: user.id,
      subscription_status: profile?.subscription_status ?? 'inactive',
      subscription_ends_at: profile?.subscription_ends_at ?? null,
      cancel_at_period_end: profile?.cancel_at_period_end ?? false,
      currency: profile?.currency ?? process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? 'USD',
      country_code: profile?.country_code ?? 'US',
      is_admin: profile?.role === 'admin',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
