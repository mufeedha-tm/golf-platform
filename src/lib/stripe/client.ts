'use client'

export async function createCheckoutSession(
  plan: 'monthly' | 'yearly',
  userId?: string
): Promise<void> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, ...(userId ? { userId } : {}) }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean
    url?: string
    error?: string
  }

  if (!res.ok || !data.success || !data.url) {
    const msg = data.error ?? 'Checkout failed'
    window.location.href = `/pricing?error=${encodeURIComponent(msg)}`
    return
  }

  window.location.href = data.url
}
