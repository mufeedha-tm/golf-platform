'use server'

import { revalidatePath } from 'next/cache'

import type { DrawMode } from '@/lib/draw-engine'
import { runAndPublishDraw } from '@/lib/services/draw-service'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function publishDraw(drawId: string, mode: DrawMode) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')

  if (!drawId?.trim()) throw new Error('No pending draw selected')

  await runAndPublishDraw(supabaseAdmin, drawId, mode, { force: true })
  revalidatePath('/admin/draws')
  revalidatePath('/dashboard/lottery')
}
