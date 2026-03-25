'use client'

import { useState, useTransition } from 'react'
import { Loader2, Save } from 'lucide-react'
import { DEFAULT_HOLES, stablefordPoints } from '@/lib/stableford'
import { saveScorecard } from '@/lib/actions/scores'

export default function ScoreTracking() {
  const todayStr = new Date().toISOString().split('T')[0]
  const [courseName, setCourseName] = useState('')
  const [playedAt, setPlayedAt] = useState(todayStr)
  const [handicap, setHandicap] = useState(12)
  const [strokes, setStrokes] = useState<Record<number, number>>({})
  const [isPending, startTransition] = useTransition()

  function setHoleStrokes(hole: number, val: string) {
    const n = parseInt(val)
    setStrokes((prev) => ({ ...prev, [hole]: isNaN(n) ? 0 : n }))
  }

  const totalStrokes = Object.values(strokes).reduce((a, b) => a + b, 0)
  const totalPoints = DEFAULT_HOLES.reduce((acc, hole) => {
    const gross = strokes[hole.number] ?? 0
    return acc + stablefordPoints(gross, hole.par, hole.strokeIndex, handicap)
  }, 0)

  function handleSave() {
    startTransition(async () => {
      await saveScorecard({ courseName, playedAt, playingHandicap: handicap, strokes })
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Score Tracker</h1>
          <p className="text-zinc-400 mt-1">Log a new round. Points calculate automatically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Course Name</label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
                placeholder="Pinehurst No. 2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Date Played</label>
              <input
                type="date"
                value={playedAt}
                onChange={(e) => setPlayedAt(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Playing Handicap: <span className="text-white font-semibold">{handicap}</span></label>
            <input
              type="range" min={0} max={54} value={handicap}
              onChange={(e) => setHandicap(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3 text-left">Hole</th>
                  <th className="pb-3">Par</th>
                  <th className="pb-3">SI</th>
                  <th className="pb-3">Strokes</th>
                  <th className="pb-3 text-right text-indigo-400">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {DEFAULT_HOLES.map((hole) => {
                  const gross = strokes[hole.number] ?? 0
                  const pts = stablefordPoints(gross, hole.par, hole.strokeIndex, handicap)
                  return (
                    <tr key={hole.number} className="hover:bg-white/[0.02] transition">
                      <td className="py-2 font-medium text-white">{hole.number}</td>
                      <td className="py-2 text-center text-zinc-400">{hole.par}</td>
                      <td className="py-2 text-center text-zinc-500">{hole.strokeIndex}</td>
                      <td className="py-2 text-center">
                        <input
                          type="number" min={1} max={15}
                          value={gross || ''}
                          placeholder="—"
                          onChange={(e) => setHoleStrokes(hole.number, e.target.value)}
                          className="w-16 bg-black/40 border border-white/10 rounded-md px-2 py-1 text-white text-center focus:outline-none focus:border-indigo-500 transition"
                        />
                      </td>
                      <td className={`py-2 text-right font-bold ${pts >= 3 ? 'text-emerald-400' : pts <= 1 ? 'text-rose-400' : 'text-zinc-300'}`}>
                        {gross > 0 ? pts : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-medium">Round Summary</h3>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-zinc-400">Total Strokes</span>
              <span className="font-semibold">{totalStrokes || '—'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-zinc-400">Stableford Pts</span>
              <span className={`font-bold text-2xl ${totalPoints > 45 || (totalStrokes > 0 && totalPoints < 1) ? 'text-rose-500' : 'text-indigo-400'}`}>
                {totalPoints || '—'}
              </span>
            </div>
            {(totalPoints > 45 || (totalStrokes > 0 && totalPoints < 1)) && (
              <p className="text-xs text-rose-500 font-medium tracking-tight">
                Score must be between 1 and 45 points.
              </p>
            )}
            <div className="flex justify-between pb-2">
              <span className="text-zinc-400">Holes Played</span>
              <span className="font-semibold">{Object.values(strokes).filter(Boolean).length} / 18</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isPending || !courseName || totalPoints > 45 || (totalStrokes > 0 && totalPoints < 1)}
            className="w-full glow-btn flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? 'Saving…' : 'Save Round'}
          </button>
        </div>
      </div>
    </div>
  )
}
