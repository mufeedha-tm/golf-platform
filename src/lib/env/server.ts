
const ALWAYS_REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const PRODUCTION_STRIPE = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] as const

export function assertServerEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === '1') return

  const missing: string[] = []

  for (const name of ALWAYS_REQUIRED) {
    if (!process.env[name]?.trim()) missing.push(name)
  }

  if (process.env.NODE_ENV === 'production') {
    for (const name of PRODUCTION_STRIPE) {
      if (!process.env[name]?.trim()) missing.push(name)
    }
  }

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}. See .env.example for descriptions.`
    console.error(`[env] ${msg}`)
    throw new Error(msg)
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      console.warn('[env] STRIPE_SECRET_KEY is not set — checkout and billing will fail until configured.')
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
      console.warn('[env] STRIPE_WEBHOOK_SECRET is not set — webhooks will fail until configured.')
    }
  }
}

export function getPublicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  )
}
