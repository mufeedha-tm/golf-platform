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
  return user
}

function parseImageLines(lines: string): string[] {
  return lines
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseEventsJson(json: string): unknown | null {
  const t = json.trim()
  if (!t) return null
  return JSON.parse(t) as unknown
}

export async function adminCreateCharity(input: {
  name: string
  description: string
  category: string
  region: string
  logo_url: string
  featured: boolean
  active: boolean
  imagesLines: string
  eventsJson: string
}) {
  await requireAdmin()
  let events: unknown | null = null
  try {
    events = parseEventsJson(input.eventsJson)
  } catch {
    throw new Error('Invalid events JSON')
  }
  const { error } = await supabaseAdmin.from('charities').insert({
    name: input.name,
    description: input.description || null,
    category: input.category,
    region: input.region,
    logo_url: input.logo_url || null,
    featured: input.featured,
    active: input.active,
    images: parseImageLines(input.imagesLines),
    events: events as object | null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/charities')
  revalidatePath('/charities')
}

export async function adminUpdateCharity(
  id: string,
  input: {
    name: string
    description: string
    category: string
    region: string
    logo_url: string
    featured: boolean
    active: boolean
    imagesLines: string
    eventsJson: string
  }
) {
  await requireAdmin()
  let events: unknown | null = null
  try {
    events = parseEventsJson(input.eventsJson)
  } catch {
    throw new Error('Invalid events JSON')
  }
  const { error } = await supabaseAdmin
    .from('charities')
    .update({
      name: input.name,
      description: input.description || null,
      category: input.category,
      region: input.region,
      logo_url: input.logo_url || null,
      featured: input.featured,
      active: input.active,
      images: parseImageLines(input.imagesLines),
      events: events as object | null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/charities')
  revalidatePath('/charities')
}

export async function adminSetCharityActive(id: string, active: boolean) {
  await requireAdmin()
  const { error } = await supabaseAdmin.from('charities').update({ active }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/charities')
  revalidatePath('/charities')
}

export async function adminListScorecards(userId: string) {
  await requireAdmin()
  const { data, error } = await supabaseAdmin
    .from('scorecards')
    .select('id, played_at, total_points, course_name')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function adminUpdateScorecard(
  scorecardId: string,
  patch: { total_points: number; played_at: string }
) {
  await requireAdmin()
  if (patch.total_points < 1 || patch.total_points > 45) {
    throw new Error('total_points must be between 1 and 45')
  }
  const { error } = await supabaseAdmin
    .from('scorecards')
    .update({
      total_points: patch.total_points,
      played_at: patch.played_at,
    })
    .eq('id', scorecardId)
  if (error) throw new Error(error.message)
}

export async function adminUpdateUserProfile(
  userId: string,
  patch: { handicap_index?: number; subscription_status?: string }
) {
  await requireAdmin()
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
