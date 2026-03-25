'use client'

import { motion, useScroll } from 'framer-motion'
import { 
  Trophy, 
  Target, 
  Heart, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Star,
  Users,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'

interface Charity {
  id: string;
  name: string;
  description: string;
  logo_url: string;
}

export default function LandingContent({ featuredCharity, totalJackpot }: { featuredCharity: Charity | null, totalJackpot: number }) {
  const containerRef = useRef(null)
  useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  return (
    <div ref={containerRef} className="relative bg-black text-white selection:bg-indigo-500 selection:text-white overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-ambient" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[120px] rounded-full animate-ambient" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-40">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-12 max-w-5xl"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full glass border-white/10 text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
            <Star className="w-3 h-3 text-amber-500" />
            The Future of Competitive Play
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-[0.9]">
            The New Era <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">of Performance.</span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Stop tracking scores. Start building impact. A premium ecosystem designed for the elite competitor who plays for more than just a trophy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Link href="/pricing" className="glow-btn px-12 py-5 text-lg group bg-white text-black">
              Subscribe Now
              <ArrowRight className="inline-block ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="glass px-12 py-5 text-lg font-bold rounded-2xl border-white/5 hover:bg-white/5 transition-all">
              Discover System
            </Link>
          </div>
        </motion.div>

        {/* Floating Modules Preview */}
        <div className="absolute bottom-20 left-0 right-0 overflow-hidden py-10 opacity-30 pointer-events-none">
           <div className="flex gap-10 animate-float">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass w-[400px] h-[200px] rounded-[2rem] flex items-center justify-center shrink-0 border-white/5">
                   <Zap className="w-10 h-10 text-white/10" />
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="relative py-40 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Pure Mechanics. <br />Deep Impact.</h2>
            <div className="space-y-8">
              {[
                { title: 'Predictive Stableford', desc: 'Real-time stoke allocation powered by advanced community indices.', icon: Target },
                { title: 'Emotional Rewards', desc: 'Win life-changing monthly jackpots while funding critical global charities.', icon: Heart },
                { title: 'Elite Network', desc: 'Secure verification for all payouts ensuring a fair, high-stakes environment.', icon: ShieldCheck },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-indigo-500/10 transition-colors">
                      <item.icon className="w-6 h-6 text-white" />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-xl font-bold">{item.title}</h4>
                      <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
             <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full" />
             <div className="glass-card aspect-square flex items-center justify-center p-20 relative z-10">
                <div className="text-center space-y-4">
                   <div className="text-8xl font-black font-mono tracking-tighter">${totalJackpot.toLocaleString()}</div>
                   <p className="text-xs font-bold uppercase tracking-[0.4em] text-pink-500">Current Monthly Jackpot</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Charity Spotlight Segment */}
      {featuredCharity && (
        <section className="relative py-40 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-[3rem] overflow-hidden border-white/5 p-12 lg:p-20 relative"
            >
              <div className="absolute top-0 right-0 w-1/3 h-full bg-pink-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-widest">
                    <Heart className="w-3 h-3" />
                    Charity Spotlight
                  </div>
                  <h2 className="text-5xl font-bold tracking-tight text-white leading-[1.1]">
                    Supporting <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-500">{featuredCharity.name}</span>
                  </h2>
                  <p className="text-xl text-zinc-500 leading-relaxed max-w-xl">
                    {featuredCharity.description}
                  </p>
                  <div className="flex gap-6">
                    <Link href={`/charities/${featuredCharity.id}`} className="px-8 py-4 bg-white text-black rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href={`/charities/${featuredCharity.id}`} className="px-8 py-4 glass border-white/10 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/5 transition">
                      Direct Donation <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="relative aspect-video rounded-3xl overflow-hidden glass border-white/10">
                   <Image
                    src={featuredCharity.logo_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop'}
                    alt={featuredCharity.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                   <div className="absolute bottom-6 left-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-2 border-white/20 p-1 flex items-center justify-center bg-black/40 backdrop-blur-md">
                        <Star className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">Featured Partner</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Verified Integrity</p>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Social Proof Segment */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12 text-zinc-500 uppercase text-[10px] font-bold tracking-[0.3em]">
          <div className="flex items-center gap-3"><Users className="w-4 h-4" /> 12.4k Competitors</div>
          <div className="flex items-center gap-3"><Trophy className="w-4 h-4" /> $1.2M Total Rewards</div>
          <div className="flex items-center gap-3"><Heart className="w-4 h-4" /> 42 Charity Partners</div>
          <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4" /> 100% Payout Rate</div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-60 px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-12"
        >
          <h3 className="text-6xl md:text-8xl font-bold tracking-tighter">Ready to join <br />the elite?</h3>
          <p className="text-xl text-zinc-500 font-medium">Monthly and Yearly memberships available. Start your legacy today.</p>
          <div className="pt-8">
            <Link href="/pricing" className="glow-btn px-16 py-6 text-2xl group inline-block">
              Subscribe & Enter
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 space-y-10">
           <div className="text-2xl font-bold text-white tracking-widest uppercase">GOLF<span className="text-zinc-600">SAAS</span></div>
           <div className="flex justify-center gap-10 text-xs font-bold uppercase tracking-widest overflow-hidden">
             <Link href="#" className="hover:text-white transition">Terms</Link>
             <Link href="#" className="hover:text-white transition">Privacy</Link>
             <Link href="#" className="hover:text-white transition">Verify Score</Link>
             <Link href="#" className="hover:text-white transition">Contact</Link>
           </div>
           <p className="text-[10px]">&copy; 2026 Golf SaaS Platform. All Rights Reserved. Not affiliated with any PGA organization. <br/> <span className="opacity-40">Architected by Mufeedha TM | Full Stack Developer Candidate</span></p>
        </div>
      </footer>
    </div>
  )
}
