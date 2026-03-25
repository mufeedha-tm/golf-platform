'use client'

import { useTransition } from 'react'
import { Clock, CheckCircle, XCircle, Eye, DollarSign, User, Calendar } from 'lucide-react'
import { updatePayoutStatus } from '@/lib/actions/payout-actions'
import { createClient } from '@/lib/supabase/client'

interface Payout {
  id: string;
  amount: number;
  tier: number;
  status: string;
  proof_url: string | null;
  proof_storage_path?: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function PayoutRow({ payout }: { payout: Payout }) {
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function handleStatusChange(status: 'approved' | 'rejected' | 'paid') {
    startTransition(async () => {
      await updatePayoutStatus(payout.id, status)
    })
  }

  async function handleViewProof() {
    const pathOrUrl = payout.proof_storage_path || payout.proof_url
    if (!pathOrUrl) return

    if (pathOrUrl.startsWith('http')) {
      window.open(pathOrUrl, '_blank')
      return
    }

    const { data, error } = await supabase.storage
      .from('winner-proofs')
      .createSignedUrl(pathOrUrl, 120)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      console.error('Proof access error:', error?.message)
    }
  }

  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-500" />
          </div>
          <div>
            <p className="font-bold text-white">{payout.profiles?.full_name || 'Anonymous User'}</p>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> {new Date(payout.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Match {payout.tier}</span>
          <p className="text-lg font-bold text-white">${payout.amount.toLocaleString()}</p>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          payout.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
          payout.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
          payout.status === 'paid' ? 'bg-pink-500/10 text-pink-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {payout.status === 'pending' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
          {payout.status}
        </div>
      </td>
      <td className="px-8 py-6">
        {payout.proof_url ? (
          <button 
            onClick={handleViewProof}
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            <Eye className="w-4 h-4" /> View ID/Proof
          </button>
        ) : (
          <span className="text-xs text-zinc-600">No proof yet</span>
        )}
      </td>
      <td className="px-8 py-6 text-right space-x-2">
        {payout.status === 'pending' && (
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => handleStatusChange('rejected')}
              disabled={isPending}
              className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"
            >
              <XCircle className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleStatusChange('approved')}
              disabled={isPending}
              className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        {payout.status === 'approved' && (
          <button 
            onClick={() => handleStatusChange('paid')}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition flex items-center gap-2 ml-auto"
          >
            <DollarSign className="w-4 h-4" />
            Mark as Paid
          </button>
        )}
        {payout.status === 'paid' && (
           <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 justify-end">
             <CheckCircle className="w-3 h-3" /> Processed
           </span>
        )}
      </td>
    </tr>
  )
}
