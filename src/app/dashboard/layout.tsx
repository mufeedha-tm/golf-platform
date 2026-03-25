import { createClient } from '@/lib/supabase/server'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role, full_name')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const canEnterScores =
    profile?.role === 'admin' || profile?.subscription_status === 'active'

  return (
    <DashboardShell canEnterScores={canEnterScores} displayName={profile?.full_name ?? null}>
      {children}
    </DashboardShell>
  )
}
