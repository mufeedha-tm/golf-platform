import { createClient } from '@/lib/supabase/server'
import AdminDrawsClient from './AdminDrawsClient'

export default async function AdminDrawsPage() {
  const supabase = await createClient()
  const { data: draws } = await supabase
    .from('draws')
    .select('id, status, draw_date')
    .eq('status', 'pending')
    .order('draw_date', { ascending: true })
    .limit(1)

  const pendingDrawId = draws?.[0]?.id ?? null

  const { data: pool } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'current_prize_pool')
    .maybeSingle()

  const raw = pool?.value
  const jackpotAmount =
    typeof raw === 'number'
      ? raw
      : Number.parseFloat(String(raw ?? '0')) || 0

  return (
    <AdminDrawsClient
      pendingDrawId={pendingDrawId}
      jackpotAmount={Number.isFinite(jackpotAmount) ? jackpotAmount : 0}
    />
  )
}
