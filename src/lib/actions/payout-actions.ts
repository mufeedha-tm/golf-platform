'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
}

export async function updatePayoutStatus(
  payoutId: string,
  status: 'approved' | 'rejected' | 'paid' | 'pending'
) {
  await requireAdmin()
  const { error } = await supabaseAdmin
    .from('payouts')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/verification')
}

export async function uploadProof(payoutId: string, proofUrl: string, storagePath: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: payout } = await supabase.from('payouts').select('user_id').eq('id', payoutId).single()
  if (!payout || payout.user_id !== user.id) throw new Error('Forbidden')

  const { error } = await supabase
    .from('payouts')
    .update({
      proof_url: proofUrl,
      proof_storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/lottery')
}
