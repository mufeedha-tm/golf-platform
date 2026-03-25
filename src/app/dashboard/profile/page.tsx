import { createClient } from '@/lib/supabase/server'
import { User, Calendar, CreditCard, ShieldCheck } from 'lucide-react'
import ProfileForm from '@/components/profile/ProfileForm'
import { createBillingPortalSession } from '@/lib/actions/subscription'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { data: charities } = await supabase
    .from('charities')
    .select('id, name')
    .eq('active', true)
    .order('name', { ascending: true })

  if (!profile) return null

  const isCancelled = profile.subscription_status === 'active' && profile.cancel_at_period_end

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 w-full space-y-10">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
          <p className="text-zinc-400 text-sm mt-1">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass rounded-[2rem] p-8 border-white/5 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Service Plan</p>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                {profile.subscription_plan === 'yearly'
                  ? 'Pro yearly'
                  : profile.subscription_plan === 'monthly'
                    ? 'Pro monthly'
                    : 'Membership'}
              </h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              profile.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {profile.subscription_status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 
                {isCancelled ? 'Expires On' : 'Renewal Date'}
              </p>
              <p className="text-sm font-bold text-white">
                {profile.subscription_ends_at ? new Date(profile.subscription_ends_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Auto-Renew
              </p>
              <p className={`text-sm font-bold ${profile.cancel_at_period_end ? 'text-amber-400' : 'text-emerald-400'}`}>
                {profile.cancel_at_period_end ? 'Disabled' : 'Enabled'}
              </p>
            </div>
          </div>

          <form action={createBillingPortalSession}>
            <button
              type="submit"
              className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition"
            >
              Manage billing (Stripe)
            </button>
          </form>
        </div>

        <ProfileForm profile={profile} charities={charities ?? []} />
      </div>
    </div>
  )
}
