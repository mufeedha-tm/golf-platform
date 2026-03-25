import { createClient } from '@/lib/supabase/server'
import { Trophy, CheckCircle } from 'lucide-react'
import PayoutRow from '@/components/admin/PayoutRow'

export default async function AdminVerification() {
  const supabase = await createClient()
  
  const { data: payouts } = await supabase
    .from('payouts')
    .select(`
      *,
      profiles (
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  const pendingCount = payouts?.filter(p => p.status === 'pending').length || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-pink-500" />
            Payout Verification
          </h1>
          <p className="text-zinc-500 mt-2">Approve winner proofs and manage prize distributions.</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-400 border-white/5 flex items-center gap-2">
            <Trophy className="w-3 h-3 text-pink-500" />
            Total Pending: {pendingCount}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-6">Winner</th>
                <th className="px-8 py-6">Tier & Prize</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Proof</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payouts?.map((p) => (
                <PayoutRow key={p.id} payout={p} />
              ))}
              {(!payouts || payouts.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-zinc-600 italic">
                    No prize payouts found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
