'use client'

import { useState, useTransition } from 'react'
import { Trophy, Play, CheckCircle, Info, RefreshCw, Layers } from 'lucide-react'
import { publishDraw } from '@/lib/actions/draw-server'
import type { DrawMode, DrawResult } from '@/lib/draw-engine'

type Props = {
  pendingDrawId: string | null
  jackpotAmount: number
}

export default function AdminDrawsClient({ pendingDrawId, jackpotAmount }: Props) {
  const [mode, setMode] = useState<DrawMode>('random')
  const [simulationResult, setSimulationResult] = useState<
    (DrawResult & {
      winnerDetails?: { match5: string[]; match4: string[]; match3: string[] }
    }) | null
  >(null)
  const [isSimulating, startSim] = useTransition()
  const [isPublishing, startPublish] = useTransition()
  const [published, setPublished] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  async function handleSimulate() {
    startSim(async () => {
      const response = await fetch('/api/admin/draws/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (!response.ok) {
        throw new Error('Simulation failed')
      }
      const result = await response.json()
      setSimulationResult(result)
      setPublished(false)
      setPublishError(null)
    })
  }

  async function handlePublish() {
    if (!simulationResult || !pendingDrawId) {
      setPublishError(
        pendingDrawId ? 'Run a simulation first.' : 'No pending draw in the database — create a draw row.'
      )
      return
    }
    startPublish(async () => {
      setPublishError(null)
      try {
        await publishDraw(pendingDrawId, mode)
        setPublished(true)
      } catch (e: unknown) {
        setPublishError(e instanceof Error ? e.message : 'Publish failed')
      }
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-pink-400" />
            Monthly Draw Control
          </h1>
          <p className="text-zinc-400 mt-2">
            Simulate, analyze, and publish the monthly prize draw results.
          </p>
          {!pendingDrawId && (
            <p className="text-amber-400 text-sm mt-2">
              No pending draw found — add a row in `draws` with status `pending` before publishing.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl text-emerald-400 border-emerald-500/20">
          <Layers className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">
            Current pool: ${jackpotAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-medium">Draw Configuration</h3>
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400">Logic Mode</label>
              {(['random', 'algorithmic_most', 'algorithmic_least'] as DrawMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition flex items-center justify-between ${
                    mode === m
                      ? 'bg-white/10 border-pink-500/50 text-white'
                      : 'border-white/5 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <span className="capitalize">{m.replace('_', ' ')}</span>
                  {mode === m && <CheckCircle className="w-4 h-4 text-pink-400" />}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isSimulating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-black" />
              )}
              {isSimulating ? 'Simulating…' : 'Simulate Draw'}
            </button>
          </div>

          <div className="glass p-5 rounded-2xl bg-indigo-500/5 border-indigo-500/10 flex gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Simulation previews winners without writing to the database. Publishing runs the live draw
              pipeline and writes results.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {!simulationResult ? (
            <div className="glass h-[400px] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4 text-zinc-500">
              <RefreshCw className="w-12 h-12 opacity-20" />
              <p>Run a simulation to see results here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent pointer-events-none" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">
                  Simulation Result
                </h3>

                <div className="flex gap-4 mb-10">
                  {simulationResult.winningNumbers.map((num, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-full bg-white text-black font-extrabold text-xl flex items-center justify-center shadow-lg shadow-white/10 ring-4 ring-pink-500/20"
                    >
                      {num}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-white">{simulationResult.winners.match5.length}</p>
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Match 5</p>
                    <p className="text-xs text-pink-400 font-bold">
                      ${simulationResult.prizes.perWinner5.toFixed(2)} ea
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-white">{simulationResult.winners.match4.length}</p>
                    <p className="text-xs text-zinc-400 uppercase font-semibold">Match 4</p>
                    <p className="text-xs text-zinc-400 font-bold">
                      ${simulationResult.prizes.perWinner4.toFixed(2)} ea
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-white">{simulationResult.winners.match3.length}</p>
                    <p className="text-xs text-zinc-400 uppercase font-semibold">Match 3</p>
                    <p className="text-xs text-zinc-400 font-bold">
                      ${simulationResult.prizes.perWinner3.toFixed(2)} ea
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Tier Pools (40/35/25)</span>
                    <div className="flex gap-3 text-zinc-400">
                      <span>${simulationResult.prizes.pool5.toFixed(0)}</span>
                      <span>${simulationResult.prizes.pool4.toFixed(0)}</span>
                      <span>${simulationResult.prizes.pool3.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 mb-8">
                  <div className="flex items-center gap-2">
                    <Layers
                      className={`w-4 h-4 ${simulationResult.jackpotRollover ? 'text-amber-400' : 'text-emerald-400'}`}
                    />
                    <span className="text-sm font-medium">Jackpot Result:</span>
                  </div>
                  <span
                    className={`text-sm font-bold ${simulationResult.jackpotRollover ? 'text-amber-400' : 'text-emerald-400'}`}
                  >
                    {simulationResult.jackpotRollover
                      ? `Rollover: $${simulationResult.rolloverAmount.toFixed(2)}`
                      : 'Jackpot Won!'}
                  </span>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Potential Winners
                  </h4>
                  {simulationResult.winnerDetails && (
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {(['match5', 'match4', 'match3'] as const).map((tier) =>
                        simulationResult.winnerDetails![tier].map((email: string) => (
                          <div
                            key={`${tier}-${email}`}
                            className="flex items-center justify-between p-3 glass rounded-lg border-white/5"
                          >
                            <span className="text-sm text-zinc-300">{email}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                tier === 'match5' ? 'bg-pink-500 text-white' : 'bg-white/10 text-zinc-400'
                              }`}
                            >
                              {tier.replace('match', 'Match ')}
                            </span>
                          </div>
                        ))
                      )}
                      {Object.values(simulationResult.winnerDetails).every(
                        (arr: string[]) => arr.length === 0
                      ) && (
                        <p className="text-sm text-zinc-600 italic">No winners in this simulation.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {publishError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {publishError}
                </p>
              )}

              {!published ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || !pendingDrawId}
                  className="w-full glow-btn bg-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-pink-400 transition-colors disabled:opacity-50"
                >
                  {isPublishing ? 'Publishing Result…' : 'Publish Result to Users'}
                </button>
              ) : (
                <div className="w-full bg-emerald-500/20 text-emerald-400 py-4 rounded-xl text-center font-bold flex items-center justify-center gap-2 border border-emerald-500/30">
                  <CheckCircle className="w-5 h-5" />
                  Result Published Successfully
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
