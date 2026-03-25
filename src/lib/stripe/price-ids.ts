import 'server-only'

export function getPriceIdForPlan(plan: 'monthly' | 'yearly'): string {
  const monthly =
    process.env.STRIPE_PRICE_MONTHLY ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_ID
  const yearly =
    process.env.STRIPE_PRICE_YEARLY ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY_ID
  const id = plan === 'monthly' ? monthly : yearly
  if (!id) {
    throw new Error(
      plan === 'monthly'
        ? 'Missing STRIPE_PRICE_MONTHLY (or NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_ID)'
        : 'Missing STRIPE_PRICE_YEARLY (or NEXT_PUBLIC_STRIPE_PRICE_YEARLY_ID)'
    )
  }
  return id
}
