# Sports Card Shop

A production-ready sports card collection and e-commerce website built with Next.js 15 App Router, Supabase, Stripe, and Tailwind CSS.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict mode) |
| Database | Supabase (Postgres + Auth + Storage) |
| Payments | Stripe Checkout Sessions + Webhooks |
| Styling | Tailwind CSS + shadcn/ui primitives |
| Hosting | Vercel |
| Package manager | pnpm |

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo-url>
cd sports-card-shop
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in every value:

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API (secret) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API Keys (secret) |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → your endpoint |
| `NEXT_PUBLIC_SITE_URL` | Your production URL (e.g. `https://mycards.vercel.app`) |
| `ADMIN_EMAIL` | Email address of your Supabase admin user |

> **Security Note:** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` must **never** be exposed to the browser. They are validated server-side only.

### 3. Set up Supabase

#### Run the database migration

In the Supabase dashboard, open the **SQL Editor** and paste the contents of `supabase/migrations/0001_initial.sql`, then click **Run**.

#### Create the storage bucket

In Supabase → Storage, create a bucket named `card-images` and set it to **Public**.

#### Create your admin user

In Supabase → Authentication → Users, click **Invite user** and enter the email address that matches `ADMIN_EMAIL` in your `.env.local`. Set a password.

### 4. Set up Stripe webhooks

In the Stripe dashboard → Developers → Webhooks, add an endpoint:

- **URL:** `https://yourdomain.com/api/stripe/webhook`
- **Events to listen for:**
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `payment_intent.payment_failed`

Copy the **Signing Secret** and add it as `STRIPE_WEBHOOK_SECRET`.

For **local development**, use the Stripe CLI:

```bash
./stripe.exe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
/
├── app/
│   ├── (public)/page.tsx               # Homepage – hero, featured cards, about
│   ├── (public)/shop/page.tsx          # Shop – server-rendered grid + URL filters
│   ├── (public)/shop/[id]/page.tsx     # Card detail – images, info, Buy Now
│   ├── (public)/shop/success/page.tsx  # Post-purchase confirmation page
│   ├── (public)/collection/page.tsx    # Full collection grouped by sport
│   ├── (admin)/layout.tsx              # Admin layout + auth guard (server-side)
│   ├── (admin)/admin/page.tsx          # Dashboard – stats overview
│   ├── (admin)/admin/cards/page.tsx    # Card list table
│   ├── (admin)/admin/cards/new/page.tsx        # Add card form
│   ├── (admin)/admin/cards/[id]/edit/page.tsx  # Edit card form
│   ├── (admin)/admin/cards/actions.ts          # Server actions (create/update/delete)
│   ├── (admin)/admin/orders/page.tsx   # Orders table
│   ├── api/stripe/checkout/route.ts    # POST – create Stripe Checkout Session
│   ├── api/stripe/webhook/route.ts     # POST – handle Stripe events
│   ├── login/page.tsx
│   └── layout.tsx
├── components/
│   ├── cards/CardGrid.tsx
│   ├── cards/CardCard.tsx
│   ├── cards/CardFilters.tsx           # URL-param driven filter sidebar
│   ├── shop/BuyButton.tsx              # Client component – POST to checkout API
│   ├── SiteNav.tsx
│   └── ui/                            # shadcn/ui primitive components
├── lib/
│   ├── env.ts                         # Lazy env-var validation (throws at first use)
│   ├── types.ts                       # Shared TypeScript interfaces
│   ├── utils.ts                       # cn(), formatCents(), dollarsToC()
│   ├── supabase/client.ts             # Browser Supabase client
│   ├── supabase/server.ts             # Server Supabase client + service-role client
│   └── stripe/
│       ├── client.ts                  # Lazy Stripe singleton (getStripe())
│       └── webhooks.ts                # constructWebhookEvent()
├── middleware.ts                       # Session refresh + admin route protection
├── supabase/migrations/0001_initial.sql
├── next.config.ts                      # Security headers + image domains
├── tailwind.config.ts
└── .env.local.example
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Homepage |
| `/shop` | Public shop with filters |
| `/shop/[id]` | Card detail + buy |
| `/shop/success` | Order confirmation |
| `/collection` | Full collection (no prices) |
| `/login` | Admin login |
| `/admin` | Dashboard |
| `/admin/cards` | Manage cards |
| `/admin/cards/new` | Add a card |
| `/admin/cards/[id]/edit` | Edit a card |
| `/admin/orders` | View orders |
| `/api/stripe/checkout` | Create Stripe session |
| `/api/stripe/webhook` | Handle Stripe events |

---

## Security

- **RLS enabled** on all Supabase tables. Public can only `SELECT` from `cards`.
- **Admin routes** protected at middleware level: unauthenticated users are redirected to `/login`; authenticated users whose email doesn't match `ADMIN_EMAIL` get an "unauthorized" error.
- **Stripe secret key** only ever accessed in `lib/stripe/client.ts` (server-only).
- **Supabase service role key** only ever used in `lib/supabase/server.ts` (server-only).
- **Idempotency key** used for checkout session creation (based on card ID) to prevent duplicate charges.
- **Webhook signature** verified with `stripe.webhooks.constructEvent` before any processing.
- **Price never trusted from client** — the checkout route always reads `price_cents` from the database.
- **Security headers** set in `next.config.ts`: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- **Race condition prevention** on purchases: card status set to `pending` before creating the Stripe session, with an optimistic concurrency check.

---

## Deploy to Vercel

1. Push to GitHub.
2. Import the repository in the Vercel dashboard.
3. Add all env vars from `.env.local.example` in Vercel → Settings → Environment Variables.
4. Deploy. Vercel will run `pnpm build` automatically.

---

## Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build (type-checks too)
pnpm type-check   # TypeScript check without building
pnpm start        # Start production server
```
