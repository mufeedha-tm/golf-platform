'use client'

import { Fragment, useState, useTransition } from 'react'
import {
  Search,
  List,
  LayoutGrid,
  IdCard,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { adminListScorecards, adminUpdateScorecard, adminUpdateUserProfile } from '@/lib/actions/admin-mgmt'

export type AdminUserRow = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  subscription_status: string | null
  subscription_plan: string | null
  handicap_index: number | null
  subscription_ends_at: string | null
}

type ScoreRow = {
  id: string
  played_at: string
  total_points: number | null
  course_name: string
}

export default function AdminUsersTable({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [scoresByUser, setScoresByUser] = useState<Record<string, ScoreRow[]>>({})
  const [pending, start] = useTransition()

  const filtered = initialUsers.filter(
    (u) =>
      (u.full_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function loadScores(userId: string) {
    if (openId === userId) {
      setOpenId(null)
      return
    }
    start(async () => {
      if (!scoresByUser[userId]) {
        const rows = await adminListScorecards(userId)
        setScoresByUser((m) => ({ ...m, [userId]: rows as ScoreRow[] }))
      }
      setOpenId(userId)
    })
  }

  function saveScore(scId: string, total_points: number, played_at: string, userId: string) {
    start(async () => {
      await adminUpdateScorecard(scId, { total_points, played_at })
      const rows = await adminListScorecards(userId)
      setScoresByUser((m) => ({ ...m, [userId]: rows as ScoreRow[] }))
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">User management</h1>
        <p className="text-zinc-500">
          Edit profiles and correct Stableford scores (PRD: admin score edits).
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 border border-white/5 p-4 rounded-3xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or email…"
            className="w-full min-h-[44px] bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`p-2 rounded-xl transition ${view === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`p-2 rounded-xl transition ${view === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="glass rounded-[2rem] overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4">Handicap</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Scores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((u) => (
                  <Fragment key={u.id}>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <IdCard className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white flex items-center gap-2 truncate">
                              {u.full_name || '—'}
                              {u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-pink-500 shrink-0" />}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-zinc-200 uppercase tracking-widest">
                          {u.subscription_plan || '—'}
                        </span>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {u.subscription_ends_at
                            ? new Date(u.subscription_ends_at).toLocaleDateString()
                            : '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step={0.1}
                          defaultValue={u.handicap_index ?? 28}
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm"
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (!Number.isFinite(v)) return
                            start(() =>
                              adminUpdateUserProfile(u.id, { handicap_index: v })
                            )
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          defaultValue={u.subscription_status ?? 'inactive'}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold uppercase"
                          onChange={(e) => {
                            const v = e.target.value
                            start(() => adminUpdateUserProfile(u.id, { subscription_status: v }))
                          }}
                        >
                          {['active', 'inactive', 'past_due', 'canceled', 'expired'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => loadScores(u.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                        >
                          {pending && openId === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : openId === u.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          Edit scores
                        </button>
                      </td>
                    </tr>
                    {openId === u.id && scoresByUser[u.id] && (
                      <tr className="bg-black/30">
                        <td colSpan={5} className="px-6 py-4">
                          <p className="text-[10px] font-bold uppercase text-zinc-500 mb-3">
                            Latest scores (1–45 pts, reverse chronological)
                          </p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {scoresByUser[u.id].map((s) => (
                              <ScoreEditorRow
                                key={s.id}
                                s={s}
                                onSave={(pts, date) => saveScore(s.id, pts, date, u.id)}
                              />
                            ))}
                            {scoresByUser[u.id].length === 0 && (
                              <p className="text-sm text-zinc-600">No scorecards.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((u) => (
            <div key={u.id} className="glass p-6 rounded-[2rem] space-y-4">
              <h4 className="font-bold truncate">{u.full_name || u.email}</h4>
              <p className="text-xs text-zinc-500">{u.subscription_status}</p>
              <button
                type="button"
                onClick={() => loadScores(u.id)}
                className="text-xs font-bold text-indigo-400"
              >
                View / edit scores
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreEditorRow({
  s,
  onSave,
}: {
  s: ScoreRow
  onSave: (pts: number, date: string) => void
}) {
  const [pts, setPts] = useState(s.total_points ?? 0)
  const [date, setDate] = useState(
    typeof s.played_at === 'string' ? s.played_at.slice(0, 10) : ''
  )
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm glass p-3 rounded-xl border border-white/5">
      <span className="text-zinc-500 truncate max-w-[140px]">{s.course_name}</span>
      <label className="flex items-center gap-1 text-zinc-500">
        pts
        <input
          type="number"
          min={1}
          max={45}
          value={pts}
          onChange={(e) => setPts(Number(e.target.value))}
          className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-1 text-zinc-500">
        date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
        />
      </label>
      <button
        type="button"
        onClick={() => onSave(pts, date)}
        className="ml-auto px-3 py-1 rounded-lg bg-white text-black text-xs font-bold"
      >
        Save
      </button>
    </div>
  )
}
