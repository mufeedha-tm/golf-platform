# Golf SaaS — setup & PRD checklist

## Requirements

- Node.js 20+
- npm 10+
- Supabase (PostgreSQL + Auth + Storage)
- Stripe (test mode supported)
- Resend (email)

## Environment variables

Create `.env.local` (never commit it; it is git-ignored).

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Default presentation currency (ISO 4217; also used for one-off donations)
NEXT_PUBLIC_DEFAULT_CURRENCY=usd

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY_ID=
STRIPE_PRICE_YEARLY_ID=

CRON_SECRET=
RESEND_API_KEY=
```

## Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

1. In Supabase SQL Editor, run **`supabase/schema.sql`** (full schema + incremental `ALTER`s).
2. Confirm Storage bucket **`winner-proofs`** exists (created in schema).
3. For **monthly draw cron**, ensure `draws` rows have `scheduled_for` (or `draw_date` fallback) and `status = 'pending'`.

### Score retention (DB)

- At most **5 scorecards per user**, enforced by trigger `scorecards_keep_latest_five` (new row can evict older rows).
- `total_points` must be in **1–45** when set.

### Payouts

- `payment_status`: `pending` | `paid` (workflow `status` remains `pending` | `approved` | `rejected` | `paid`).
- Proof: client uploads to **`winner-proofs/{userId}/...`**; DB stores **`proof_storage_path`** and a long-lived **signed URL** in **`proof_url`**.

## API surface (for web + future mobile clients)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/webhooks/stripe` | Stripe webhooks |
| `POST` | `/api/cron/execute-draw` | Monthly draw runner (`Authorization: Bearer CRON_SECRET`) |
| `POST` | `/api/admin/draws/simulate` | Admin-only dry run |
| `POST` | `/api/scorecards` | Subscription check (scores still submitted via server action) |
| `POST` | `/api/draws/participate` | Subscription check for draw eligibility |
| `GET` | `/api/me/subscription` | Current user subscription snapshot (JSON) |

## Subscription lifecycle (profile `subscription_status`)

Stripe events map to:

- `active` — paid / `trialing`
- `past_due` — `past_due`, `unpaid`
- `canceled` — Stripe `canceled`
- `expired` — subscription deleted or terminal incomplete states

Admins bypass score/draw gates.

## Access control

- **Proxy** (`src/proxy.ts`, Next.js 16 “middleware” replacement): login for `/dashboard` and `/admin`; **active subscription** required for `/dashboard/scores`, `/dashboard/lottery`, and the score/draw API routes above.
- **Limited dashboard**: non-subscribers can open `/dashboard` (overview) but not scores or draw participation.

## Independent charity donations

- `/charities` — search & category filter (database-backed).
- `/charities/[id]` — profile + **standalone donation** form (Stripe Checkout, `metadata.type = donation`, no subscription).

## Test credentials (fill in locally)

Do **not** commit real secrets; use placeholders in your password manager.

| Service | Test ID / key | Notes |
|--------|----------------|--------|
| Stripe publishable | `pk_test_…` | Optional if you only use Checkout server-side |
| Stripe secret | `sk_test_…` | Required |
| Stripe webhook | `whsec_…` | From `stripe listen` or Dashboard |
| Stripe prices | `price_…` | Monthly + yearly subscription prices |
| Supabase | project URL + anon + service role | Service role only on server |
| Resend | API key | For transactional email |

## Manual test checklist

- [ ] Sign up / login; **non-subscriber** sees dashboard overview but **cannot** open scores or lottery (redirect / locked nav).
- [ ] Subscribe (Stripe test card); status becomes **active**; scores and lottery unlock.
- [ ] Add **6th** scorecard → only **5** remain in DB; list is **played_at / created_at desc**.
- [ ] Total points **outside 1–45** rejected by app + DB check.
- [ ] **Charity directory**: search + filter; detail page loads from Supabase.
- [ ] **Standalone donation** completes; webhook inserts `charity_donations` with `source_type = individual`.
- [ ] **Proof upload** writes to Storage and updates `payouts.proof_*` + `payment_status`.
- [ ] Admin sets payout to **paid** → `payment_status = paid`.
- [ ] **Draw** blocked until `scheduled_for` / `draw_date` is due; cron can complete pending draw.
- [ ] `GET /api/me/subscription` returns JSON for authenticated user.
- [ ] `POST /api/scorecards` returns **403** without active subscription.

## Performance notes

- Prefer `next/image` with `remotePatterns` in `next.config.ts` for hero and charity assets.
- Keep long-running work in route handlers or cron, not in middleware.
