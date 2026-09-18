# Tri-State Local Mailer

QR-code scan tracking, lead capture, and push-notification alerts for the
advertisers on a local postcard mailing program. An advertiser gets a
printed QR code on their postcard slot; scanning it logs a visit, redirects
to their own page, and — if the visitor opts in — captures a lead the
advertiser is notified about instantly.

## How a scan flows through the app

1. A visitor scans the QR code printed on the postcard, which points at
   `/r/<code>` (`app/r/[code]/route.ts`).
2. That route looks up the matching `ad_slots` row, logs a `scans` row
   (device type, city/region, a salted IP hash — never the raw IP), fires a
   push notification to the advertiser, and 302s the visitor on to
   `ad_slots.destination_url` with `?scan_id=...` attached.
3. The advertiser's destination page embeds `<OptInForm adSlotId="..." />`
   (`components/OptInForm.tsx`), which reads `scan_id` off the query string
   and POSTs to `/api/leads` (`app/api/leads/route.ts`) if the visitor opts
   in. That also notifies the advertiser.
4. The advertiser dashboard (`app/dashboard`) shows scan counts and the
   lead list per ad slot, scoped to just their own data by Supabase RLS.
   From there they can enable push notifications
   (`components/EnableNotificationsButton.tsx`), which registers
   `public/sw.js` and subscribes the browser to web push.

## Environment variables

```
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, never expose to the client
SUPABASE_ANON_KEY=                  # used for the dashboard's RLS-scoped reads

# Scan privacy
IP_HASH_SALT=                       # any long random string

# Web push
VAPID_PUBLIC_KEY=                   # generate with `npx web-push generate-vapid-keys`
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=       # same value as VAPID_PUBLIC_KEY, exposed to the browser

# Clerk (advertiser sign-in)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Copy `.env.example` to `.env.local` and fill these in.

`SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, and the two Clerk keys
weren't in the original setup notes — they're needed because the dashboard
reads happen through an *authenticated, RLS-scoped* client
(`lib/supabase-clerk.ts`), and because `applicationServerKey` and Clerk's
publishable key have to be readable from the browser bundle.

## Dependencies

```
npm install
```

(`@supabase/supabase-js`, `web-push`, and `@clerk/nextjs` are already in
`package.json`.)

## Row Level Security

Run `supabase/schema.sql` once in the Supabase SQL editor (or via the CLI)
against a fresh project. It creates `ad_slots`, `scans`, `leads`, and
`push_subscriptions`, and enables RLS so an advertiser can only ever read
rows tied to their own `ad_slots`:

```sql
alter table scans enable row level security;
alter table leads enable row level security;
alter table ad_slots enable row level security;

create policy "Advertisers see own scans"
  on scans for select
  using (
    ad_slot_id in (
      select id from ad_slots where advertiser_id = auth.uid()
    )
  );

create policy "Advertisers see own leads"
  on leads for select
  using (
    ad_slot_id in (
      select id from ad_slots where advertiser_id = auth.uid()
    )
  );

create policy "Advertisers see own ad slots"
  on ad_slots for select
  using (advertiser_id = auth.uid());
```

`ad_slots.advertiser_id` is the advertiser's Clerk user id — Clerk is
configured in the Supabase dashboard as a third-party auth provider, so
`auth.uid()` resolves to that same id once `lib/supabase-clerk.ts` attaches
the advertiser's Clerk session token to a Supabase request.

The redirect route, lead-capture endpoint, and push-subscribe endpoint all
use the service-role key, which bypasses RLS by design — they need to
write scans/leads/subscriptions for visitors and devices that aren't
signed in at all. RLS is what protects the *read* side, when the
advertiser dashboard queries Supabase directly.

## Project structure

```
app/
  r/[code]/route.ts          Scan-logging redirect (the QR target)
  api/leads/route.ts         Lead capture, called from OptInForm
  api/push/subscribe/route.ts  Saves a push subscription for the signed-in advertiser
  code-not-found/page.tsx    Shown when a code doesn't match an active ad slot
  dashboard/                 Advertiser dashboard (protected by middleware.ts)
  privacy/page.tsx           Renders docs/privacy-policy.md
components/
  OptInForm.tsx               Embed on an advertiser's destination page
  EnableNotificationsButton.tsx  Registers the service worker + push subscription
lib/
  supabase-server.ts          Service-role client (server-only)
  supabase-clerk.ts           RLS-scoped client for the dashboard
  push.ts                     notifyAdvertiser() — sends web push, prunes stale subscriptions
  ip-hash.ts / device.ts / geo.ts   Scan-logging helpers
public/sw.js                  Service worker (push + notification click handling)
supabase/schema.sql           Tables + RLS policies
docs/privacy-policy.md        Source of truth for app/privacy/page.tsx
```

## Local development

```
npm install
cp .env.example .env.local   # fill in the values above
npm run dev
```

## Still needed before launch

- Real app icons at `public/icon-192.png` / `public/icon-512.png`
  (`public/sw.js` and `public/site.webmanifest` already reference them).
- Fill in `[DATE]` and `[CONTACT EMAIL]` in `docs/privacy-policy.md` and
  `app/privacy/page.tsx` — kept in sync by hand, not generated from one
  source.
- An admin flow for creating `ad_slots` rows per advertiser (this repo
  assumes they already exist; there's no admin UI for provisioning a new
  code yet).
- A per-advertiser destination page that embeds `<OptInForm />` — the sales
  pipeline tracker (business name, contact info, slot type, pricing) lives
  outside this repo, in the advertiser tracker spreadsheet.
