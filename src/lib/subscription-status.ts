
export function mapStripeStatusToProfile(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'incomplete':
      return 'incomplete';
    case 'incomplete_expired':
    case 'paused':
      return 'expired';
    default:
      return stripeStatus === 'ended' ? 'expired' : 'inactive';
  }
}

export function isSubscriptionActiveForAccess(profileStatus: string | null | undefined): boolean {
  return profileStatus === 'active';
}
