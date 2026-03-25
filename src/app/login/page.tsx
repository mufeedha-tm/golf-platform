import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('id, name, category')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name', { ascending: true })

  return <LoginForm charities={charities ?? []} />
}
