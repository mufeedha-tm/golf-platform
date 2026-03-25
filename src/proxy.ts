import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getUserSubscriptionFromProfileRow } from '@/lib/subscription/subscription-access'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAccessingDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAccessingAdmin = request.nextUrl.pathname.startsWith('/admin')
  /** PRD: subscriber-only dashboard + score/draw APIs. */
  const needsActiveSubscription =
    isAccessingDashboard ||
    request.nextUrl.pathname.startsWith('/api/scorecards') ||
    request.nextUrl.pathname.startsWith('/api/draws/participate');

  if (!user && (isAccessingDashboard || isAccessingAdmin)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (isAccessingDashboard || isAccessingAdmin || needsActiveSubscription)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, role')
      .eq('id', user.id)
      .single()

    const { active: subscriptionActive } = getUserSubscriptionFromProfileRow(profile)
    const isAdmin = profile?.role === 'admin'
    const isActive = subscriptionActive || isAdmin

    if (isAccessingAdmin && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.set('error', 'admin_required')
      return NextResponse.redirect(url)
    }

    if (needsActiveSubscription && !isActive) {
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      url.searchParams.set('error', 'subscription_required')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
