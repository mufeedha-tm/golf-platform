'use client'

import { useState, useTransition } from 'react'
import { Upload, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ProofUpload({ payoutId }: { payoutId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploaded, setUploaded] = useState(false)
  const supabase = createClient()

  async function handleUpload() {
    if (!file) return

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${payoutId}.${fileExt}`
      const filePath = `${user.id}/${fileName}` // Nested under UID for RLS

      // 1. Upload to Supabase Storage (Private 'winner-proofs' bucket)
      const { error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload failed:', uploadError.message)
        return
      }

      const { data: signed } = await supabase.storage
        .from('winner-proofs')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365)

      const { uploadProof } = await import('@/lib/actions/payout-actions')
      try {
        await uploadProof(payoutId, signed?.signedUrl ?? filePath, filePath)
        setUploaded(true)
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Record update failed:', error.message)
      }
    })
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/30">
        <CheckCircle2 className="w-5 h-5" />
        <span>Proof uploaded successfully for verification.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <p className="text-zinc-400 text-sm">Please upload a photo of yourself with your winnings or ID to verify the payout.</p>
      <div className="flex items-center gap-4">
        <input
          type="file"
          id="proof"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label
          htmlFor="proof"
          className="cursor-pointer glass px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {file ? file.name : 'Choose File'}
        </label>
        {file && (
          <button
            onClick={handleUpload}
            disabled={isPending}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Proof'}
          </button>
        )}
      </div>
    </div>
  )
}
