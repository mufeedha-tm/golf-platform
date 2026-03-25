'use client'

import { useEffect, useState } from 'react'
import AdminUsersTable, { type AdminUserRow } from '@/components/admin/AdminUsersTable'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: profiles } = await supabase.from('profiles').select('*')

        const mapped = (profiles ?? []).map((p) => ({
          id: p.id,
          email: p.email ?? '',
          full_name: p.full_name ?? null,
          role: p.role ?? 'user',
          subscription_status: p.subscription_status ?? 'inactive',
          subscription_plan: p.subscription_plan ?? null,
          handicap_index: p.handicap_index ?? null,
          subscription_ends_at: p.subscription_ends_at ?? null,
        }))

        setUsers(mapped)
      } catch (e) {
        console.log("Error loading users")
      }
    }

    fetchUsers()
  }, [])

  return <AdminUsersTable initialUsers={users} />
}