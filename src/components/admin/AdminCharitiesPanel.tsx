'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Plus, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import {
  adminCreateCharity,
  adminUpdateCharity,
  adminSetCharityActive,
} from '@/lib/actions/admin-mgmt'

export type CharityAdminRow = {
  id: string
  name: string
  category: string | null
  region: string | null
  active: boolean
  featured: boolean
  description: string | null
  logo_url: string | null
  images: string[] | null
  events: unknown | null
}

export default function AdminCharitiesPanel({ charities }: { charities: CharityAdminRow[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Education')
  const [region, setRegion] = useState('UK')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [imagesLines, setImagesLines] = useState('')
  const [eventsJson, setEventsJson] = useState('')
  const [active, setActive] = useState(true)

  const [editId, setEditId] = useState<string | null>(null)

  function startEdit(c: CharityAdminRow) {
    setEditId(c.id)
    setName(c.name)
    setCategory(c.category ?? 'Community')
    setRegion(c.region ?? 'UK')
    setDescription(c.description ?? '')
    setLogoUrl(c.logo_url ?? '')
    setFeatured(c.featured)
    setActive(c.active)
    setImagesLines((c.images ?? []).join('\n'))
    setEventsJson(c.events ? JSON.stringify(c.events, null, 2) : '')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            Charity partners
          </h1>
          <p className="text-zinc-500 mt-2">
            Add, edit, media (image URLs), and feature flag — synced to the public directory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 glass rounded-[2rem] overflow-hidden border-white/5">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-4">Partner</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {charities.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold">{c.name}</span>
                      {c.featured && (
                        <span className="text-[8px] text-amber-400 font-bold uppercase tracking-widest mt-1">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{c.category}</td>
                  <td className="px-6 py-4">
                    <div
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${
                        c.active ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                    >
                      {c.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {c.active ? 'active' : 'inactive'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-xs font-bold text-white hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        start(async () => {
                          await adminSetCharityActive(c.id, !c.active)
                          router.refresh()
                        })
                      }
                      className="text-xs font-bold text-zinc-400 hover:text-white"
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-[2rem] border-pink-500/10 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-500" />
              {editId ? 'Edit charity' : 'Quick creator'}
            </h3>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm"
              />
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Region"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm"
              />
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Logo image URL"
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Featured on homepage
              </label>
              <textarea
                value={imagesLines}
                onChange={(e) => setImagesLines(e.target.value)}
                placeholder="Gallery image URLs (one per line)"
                rows={3}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono"
              />
              <textarea
                value={eventsJson}
                onChange={(e) => setEventsJson(e.target.value)}
                placeholder='Events JSON e.g. [{"title":"Open day","date":"June 1","type":"Event"}]'
                rows={4}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono"
              />
            </div>
            <button
              type="button"
              disabled={pending || !name.trim()}
              onClick={() =>
                start(async () => {
                  if (editId) {
                    await adminUpdateCharity(editId, {
                      name: name.trim(),
                      description,
                      category,
                      region,
                      logo_url: logoUrl,
                      featured,
                      active,
                      imagesLines,
                      eventsJson,
                    })
                    setEditId(null)
                  } else {
                    await adminCreateCharity({
                      name: name.trim(),
                      description,
                      category,
                      region,
                      logo_url: logoUrl,
                      featured,
                      active: true,
                      imagesLines,
                      eventsJson,
                    })
                  }
                  setName('')
                  setDescription('')
                  setLogoUrl('')
                  setImagesLines('')
                  setEventsJson('')
                  setFeatured(false)
                  setActive(true)
                  router.refresh()
                })
              }
              className="w-full glow-btn bg-pink-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editId ? 'Save changes' : 'Create partner'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null)
                  setName('')
                  setDescription('')
                  setLogoUrl('')
                  setImagesLines('')
                  setEventsJson('')
                }}
                className="w-full py-2 text-xs text-zinc-500"
              >
                Cancel edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
