export const dynamic = 'force-dynamic';

import { requireAdmin } from '@/lib/auth-guards'
import { supabaseAdmin } from '@/lib/supabase/admin'
import AdminUsersTable, { type AdminUserRow } from '@/components/admin/AdminUsersTable'

export default async function AdminUsersPage() {

  try {
    if (process.env.NODE_ENV !== 'production') {
      await requireAdmin()
    }
  } catch (e) {
    console.log("Skipping auth during build")
  }

  let initialUsers: AdminUserRow[] = []

  try {
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*')

    const pmap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

    initialUsers = (authData?.users ?? []).map((u) => {
      const p = pmap[u.id]
      return {
        id: u.id,
        email: u.email ?? '',
        full_name: p?.full_name ?? null,
        role: p?.role ?? 'user',
        subscription_status: p?.subscription_status ?? 'inactive',
        subscription_plan: p?.subscription_plan ?? null,
        handicap_index: p?.handicap_index != null ? Number(p.handicap_index) : null,
        subscription_ends_at: p?.subscription_ends_at ?? null,
      }
    })
  } catch (e) {
    console.log("Skipping admin data during build")
  }

  return <AdminUsersTable initialUsers={initialUsers} />
}