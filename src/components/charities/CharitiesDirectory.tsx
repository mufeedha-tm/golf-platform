'use client'

import { useMemo, useState } from 'react'
import { Search, Heart, MapPin, ArrowRight, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export type CharityRow = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  category: string | null
  region: string | null
  featured: boolean
}

export default function CharitiesDirectory({ charities }: { charities: CharityRow[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const categories = useMemo(() => {
    const set = new Set<string>()
    charities.forEach((c) => {
      if (c.category) set.add(c.category)
    })
    return ['All', ...Array.from(set).sort()]
  }, [charities])

  const filtered = charities.filter(
    (c) =>
      (search === '' || c.name.toLowerCase().includes(search.toLowerCase())) &&
      (category === 'All' || c.category === category)
  )

  const featured = charities.filter((c) => c.featured)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full space-y-12 sm:space-y-16">
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Featured Charities</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {featured.map((c) => (
            <div
              key={c.id}
              className="group relative overflow-hidden glass rounded-3xl p-6 sm:p-8 transition-all hover:ring-2 hover:ring-white/10"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">
                <Image
                  src={
                    c.logo_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`
                  }
                  className="w-24 h-24 rounded-2xl object-cover shadow-2xl shrink-0"
                  unoptimized={!c.logo_url}
                  alt={c.name}
                  width={96}
                  height={96}
                  sizes="96px"
                />
                <div className="space-y-4 min-w-0">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-2 block">
                      {c.category ?? 'Charity'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold">{c.name}</h3>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-sm line-clamp-2">
                    {c.description}
                  </p>
                  <Link
                    href={`/charities/${c.id}`}
                    className="inline-flex items-center gap-2 text-white font-semibold text-sm group/link"
                  >
                    Explore profile{' '}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8 sm:space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search charities…"
              className="w-full min-h-[48px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              aria-label="Search charities"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shrink-0 min-h-[44px] ${
                  category === cat
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/charities/${c.id}`}
              className="group glass p-6 rounded-3xl space-y-4 hover:bg-white/[0.07] transition-all"
            >
              <div className="flex items-start justify-between">
                <Image
                  src={
                    c.logo_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`
                  }
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  unoptimized={!c.logo_url}
                  alt={c.name}
                  width={64}
                  height={64}
                  sizes="64px"
                />
                <div className="p-2 bg-white/5 rounded-full text-zinc-500 group-hover:text-pink-500 transition-colors">
                  <Heart className="w-4 h-4 group-hover:fill-pink-500" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold group-hover:text-pink-400 transition-colors">{c.name}</h4>
                <div className="flex items-center gap-1.5 text-zinc-500 mt-1 text-xs">
                  <MapPin className="w-3 h-3 shrink-0" /> {c.region ?? '—'}
                </div>
              </div>
              <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
