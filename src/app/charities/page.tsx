import { createClient } from '@/lib/supabase/server'
import CharitiesDirectory, { type CharityRow } from '@/components/charities/CharitiesDirectory'

export default async function CharitiesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('charities')
    .select('id, name, description, logo_url, category, region, featured, active')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-red-400">
        Could not load charities: {error.message}
      </div>
    )
  }

  const rows = (data ?? []) as CharityRow[]
  return <CharitiesDirectory charities={rows} />
}
