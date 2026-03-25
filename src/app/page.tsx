import { createClient } from '@/lib/supabase/server'
import LandingContent from '@/components/landing/LandingContent'

export default async function Page() {
  const supabase = await createClient()
  
  const { data: featuredCharity } = await supabase
    .from('charities')
    .select('*')
    .eq('featured', true)
    .eq('active', true)
    .limit(1)
    .single()

  const { data: prizeSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'current_prize_pool')
    .single()

  const { data: rolloverSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'jackpot_rollover')
    .single()

  const totalJackpot = (Number(prizeSetting?.value) || 0) + (Number(rolloverSetting?.value) || 0)

  return <LandingContent featuredCharity={featuredCharity} totalJackpot={totalJackpot} />
}
