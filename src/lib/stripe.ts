import 'server-only'
import Stripe from 'stripe'

let stripeSingleton: Stripe | null = null

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }
  return key
}

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(getStripeSecretKey(), {
      apiVersion: '2026-02-25.clover',
      typescript: true,
      appInfo: { name: 'GolfSaaS', version: '0.1.0' },
    })
  }
  return stripeSingleton
}
