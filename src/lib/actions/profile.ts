'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function updateProfile(input: {
  full_name?: string
  handicap_index?: number
  charity_pct?: number
  chosen_charity_id?: string | null
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (input.charity_pct !== undefined && (input.charity_pct < 10 || input.charity_pct > 100)) {
    throw new Error('Charity percentage must be between 10 and 100')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name,
      handicap_index: input.handicap_index,
      charity_pct: input.charity_pct,
      chosen_charity_id: input.chosen_charity_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/charity')
}
