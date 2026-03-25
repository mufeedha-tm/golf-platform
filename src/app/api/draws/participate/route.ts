import { NextResponse } from 'next/server'
import { requireActiveSubscriptionApi } from '@/lib/api/require-active-subscription'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const gate = await requireActiveSubscriptionApi()
    if ('error' in gate) return gate.error
    return NextResponse.json({
      success: true,
      message: 'Draw participation allowed for active subscribers.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
