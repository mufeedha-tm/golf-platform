import { requireAdmin } from '@/lib/auth-guards'
import { createClient } from '@/lib/supabase/server'
import AdminCharitiesPanel, { type CharityAdminRow } from '@/components/admin/AdminCharitiesPanel'

export default async function AdminCharitiesPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .order('featured', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="p-12 text-red-400">
        Failed to load charities: {error.message}
      </div>
    )
  }

  return <AdminCharitiesPanel charities={(data ?? []) as CharityAdminRow[]} />
}
