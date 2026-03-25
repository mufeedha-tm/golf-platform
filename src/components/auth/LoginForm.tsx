'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Mail, Lock, CheckCircle2, Search, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type CharityOpt = { id: string; name: string; category: string | null }

export default function LoginForm({ charities }: { charities: CharityOpt[] }) {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)
  const [charityPct, setCharityPct] = useState(10)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const supabase = createClient()
  // Prevent double-submits that can quickly trigger Supabase email send rate limits.
  const signupInFlightRef = useRef(false)

  const filteredCharities = charities.filter(
    (c) =>
      search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function resetFlow() {
    setStep(1)
    setSelectedCharity(null)
    setMessage(null)
  }

  async function completeCharityStep() {
    if (!selectedCharity) return
    start(async () => {
      setMessage(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setMessage('Session expired. Please sign up again.')
        return
      }
      const pct = Math.max(10, Math.min(100, charityPct))
      const { error } = await supabase
        .from('profiles')
        .update({
          chosen_charity_id: selectedCharity,
          charity_pct: pct,
          email: user.email ?? email,
        })
        .eq('id', user.id)
      if (error) {
        setMessage(error.message)
        return
      }
      // PRD: non-subscribers are redirected to pricing; charity selection is a pre-step
      // so the user can subscribe after signup.
      router.push('/pricing')
      router.refresh()
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-2">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isSignup ? (step === 1 ? 'Create your account' : 'Choose your charity') : 'Welcome back'}
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base">
            {isSignup
              ? 'Subscribe later — first create your account and pick who you support (min. 10%).'
              : 'Sign in to your dashboard.'}
          </p>
        </div>

        {message && (
          <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            {message}
          </div>
        )}

        <div className="glass p-6 sm:p-8 rounded-[2rem] border-white/5 space-y-6">
          {isSignup && step === 2 ? (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search charities…"
                  className="w-full min-h-[48px] bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition"
                  aria-label="Search charities"
                />
              </div>

              <div className="space-y-2 max-h-[240px] sm:max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {filteredCharities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCharity(c.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between min-h-[48px] ${
                      selectedCharity === c.id
                        ? 'bg-pink-500/10 border-pink-500/50'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{c.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
                        {c.category ?? 'Charity'}
                      </p>
                    </div>
                    {selectedCharity === c.id && <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0" />}
                  </button>
                ))}
                {filteredCharities.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">No charities match your search.</p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Charity share of subscription</span>
                  <span className="text-sm font-bold text-emerald-400">{charityPct}% (min 10%)</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={charityPct}
                  onChange={(e) => setCharityPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  aria-label="Charity contribution percent"
                />
              </div>

              <button
                type="button"
                disabled={!selectedCharity || pending}
                onClick={() => completeCharityStep()}
                className="w-full min-h-[48px] bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Complete signup
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[48px] bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[48px] bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-white/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={pending}
                className="w-full min-h-[48px] bg-white text-black py-4 rounded-2xl font-bold shadow-xl shadow-white/5 hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group"
                onClick={() => {
                  start(async () => {
                    setMessage(null)
                    if (isSignup) {
                      if (!email || !password) {
                        setMessage('Enter email and password.')
                        return
                      }
                      if (signupInFlightRef.current) return
                      signupInFlightRef.current = true

                      try {
                        // Include `emailRedirectTo` so the confirmation email generates the correct link.
                        const { data, error } = await supabase.auth.signUp({
                          email,
                          password,
                          options: {
                            emailRedirectTo: `${window.location.origin}/login?signup=confirmed`,
                          },
                        })

                      if (error) {
                        if (error.code === 'over_email_send_rate_limit') {
                          setMessage(
                            'Email confirmation sending is temporarily rate-limited. Please wait a few minutes and try again (or check your inbox/spam for the latest confirmation email).'
                          )
                          return
                        }

                        // Surface Supabase auth error details to make debugging email issues possible.
                        setMessage(error.message + (error.code ? ` (code: ${error.code})` : ''))
                        return
                      }
                        // Your DB trigger (`public.handle_new_user`) populates `profiles.email`
                        // at `auth.users` insert time, so there's no need to update it here.
                        // Also, when email confirmation is required, `data.session` is null, and
                        // any client-side `profiles` update would fail RLS (can cause 400s).
                        if (data.session) {
                          setStep(2)
                        } else {
                          setMessage(
                            'Check your email to confirm your account, then sign in to finish charity selection.'
                          )
                        }
                      } finally {
                        signupInFlightRef.current = false
                      }
                    } else {
                      if (!email || !password) {
                        setMessage('Enter email and password.')
                        return
                      }
                      const { error } = await supabase.auth.signInWithPassword({ email, password })
                      if (error) {
                        setMessage(error.message)
                        return
                      }
                      const {
                        data: { user },
                      } = await supabase.auth.getUser()
                      if (user) {
                        const { data: prof } = await supabase
                          .from('profiles')
                          .select('chosen_charity_id')
                          .eq('id', user.id)
                          .single()
                        if (!prof?.chosen_charity_id) {
                          setIsSignup(true)
                          setStep(2)
                          return
                        }
                      }
                      router.push('/dashboard')
                      router.refresh()
                    }
                  })
                }}
              >
                {pending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSignup ? (
                  <>
                    Next: pick charity <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                resetFlow()
              }}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
