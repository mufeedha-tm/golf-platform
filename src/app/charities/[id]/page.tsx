import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Calendar, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StandaloneDonationForm from '@/components/charities/StandaloneDonationForm'

type EventItem = { title?: string; date?: string; type?: string }

export default async function CharityProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: charity, error } = await supabase
    .from('charities')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()

  if (error || !charity) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rawEvents = charity.events
  let events: EventItem[] = []
  if (Array.isArray(rawEvents)) {
    events = rawEvents as EventItem[]
  } else if (rawEvents && typeof rawEvents === 'object') {
    events = Object.values(rawEvents as Record<string, EventItem>)
  }
  const gallery = (charity.images ?? []) as string[]
  const placeholderImg =
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full space-y-12">
      <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
        <Image
          src={gallery[0] || placeholderImg}
          className="w-full h-[240px] sm:h-[400px] object-cover opacity-60"
          alt={charity.name}
          width={1200}
          height={400}
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10">
          {charity.logo_url ? (
            <Image
              src={charity.logo_url}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-black shadow-2xl relative z-10 shrink-0"
              alt={charity.name}
              width={128}
              height={128}
            />
          ) : null}
          <div className="space-y-2 mb-0 sm:mb-2">
            <span className="bg-pink-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              {charity.category ?? 'Charity'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{charity.name}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        <div className="lg:col-span-2 space-y-12 order-2 lg:order-1">
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">About</h2>
            <p className="text-zinc-400 leading-relaxed text-base sm:text-lg">{charity.description}</p>
          </section>

          {gallery.length > 1 ? (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {gallery.slice(1).map((img, i) => (
                  <Image
                    key={i}
                    src={img}
                    className="rounded-2xl h-40 w-full object-cover"
                    alt={`${charity.name} gallery ${i + 2}`}
                    width={400}
                    height={300}
                    sizes="(max-width:640px) 50vw, 33vw"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {events.length > 0 ? (
            <section className="space-y-8">
              <h2 className="text-2xl font-bold">Upcoming events</h2>
              <div className="space-y-4">
                {events.map((event, idx) => (
                  <div
                    key={idx}
                    className="glass p-5 sm:p-6 rounded-2xl flex items-center justify-between border-white/5 gap-4"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                      <div className="p-3 sm:p-4 bg-white/5 rounded-2xl shrink-0">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-base sm:text-lg truncate">{event.title}</h4>
                        <p className="text-sm text-zinc-500">
                          {event.type ?? 'Event'} {event.date ? `• ${event.date}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-8 order-1 lg:order-2">
          <div className="glass p-6 sm:p-8 rounded-3xl space-y-6 border-pink-500/10">
            <h3 className="text-lg font-bold">Independent donation</h3>
            <p className="text-sm text-zinc-500">
              Support this organisation directly. No membership or score entry required.
            </p>
            <StandaloneDonationForm charityId={charity.id} userId={user?.id ?? null} />
          </div>

          <div className="glass p-6 sm:p-8 rounded-3xl space-y-4 text-sm text-zinc-400">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
              {charity.region ?? '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
