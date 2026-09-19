# Tri-State Local Mailer

QR-code scan tracking, lead capture, and push-notification alerts for the
advertisers on a local postcard mailing program. An advertiser gets a
printed QR code on their postcard slot; scanning it logs a visit, shows a
hosted opt-in page, and forwards the visitor on to the advertiser's own
site — whether or not they choose to share their name and email first —
the advertiser never has to add anything to their own page for any of
this to work.

## How a scan flows through the app

1. A visitor scans the QR code printed on the postcard, which points at
   `/r/<code>` (`app/r/[code]/page.tsx`).
2. That page looks up the matching `ad_slots` row, logs a `scans` row
   (device type, city/region, a salted IP hash — never the raw IP), fires a
   push notification to the advertiser, and renders a hosted opt-in page
   (`app/r/[code]/OfferForm.tsx`) showing the business name.
3. The visitor can optionally enter name + email (phone optional) and hit
   Continue, or just click "skip" — either way they end up at
   `ad_slots.destination_url`, the advertiser's actual site, completely
   unmodified. Submitting the form POSTs to `/api/leads`
   (`app/api/leads/route.ts`), which saves the lead and notifies the
   advertiser before forwarding on.
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
      select id from ad_slots where advertiser_id = (auth.jwt() ->> 'sub')
    )
  );

create policy "Advertisers see own leads"
  on leads for select
  using (
    ad_slot_id in (
      select id from ad_slots where advertiser_id = (auth.jwt() ->> 'sub')
    )
  );

create policy "Advertisers see own ad slots"
  on ad_slots for select
  using (advertiser_id = (auth.jwt() ->> 'sub'));
```

`ad_slots.advertiser_id` is the advertiser's Clerk user id (e.g.
`user_3JWPHi2lBbTGzWAGUaFbSeaaj6U`) stored as `text`, **not** `uuid` — Clerk
ids aren't valid UUIDs. Clerk is configured in the Supabase dashboard as a
third-party auth provider, and `auth.jwt() ->> 'sub'` reads that id back out
of the token once `lib/supabase-clerk.ts` attaches the advertiser's Clerk
session token to a Supabase request. Use `auth.jwt() ->> 'sub'` here, not
`auth.uid()` — `auth.uid()` casts to `uuid` internally and throws on a
Clerk id.

The scan page, lead-capture endpoint, and push-subscribe endpoint all use
the service-role key, which bypasses RLS by design — they need to write
scans/leads/subscriptions for visitors and devices that aren't signed in
at all. RLS is what protects the *read* side, when the advertiser
dashboard queries Supabase directly.

## Project structure

```
app/
  r/[code]/page.tsx           Scan-logging + hosted opt-in page (the QR target)
  r/[code]/OfferForm.tsx      The name/email form shown there, before forwarding on
  api/leads/route.ts          Lead capture, called from OfferForm
  api/push/subscribe/route.ts  Saves a push subscription for the signed-in advertiser
  api/admin/ad-slots/route.ts  Creates an ad_slots row, admin-only
  code-not-found/page.tsx    Shown when a code doesn't match an active ad slot
  dashboard/                 Advertiser dashboard (protected by middleware.ts)
  admin/                     Create ad slots + download QR codes (admin-only, see below)
  privacy/page.tsx           Renders docs/privacy-policy.md
components/
  EnableNotificationsButton.tsx  Registers the service worker + push subscription
lib/
  supabase-server.ts          Service-role client (server-only)
  supabase-clerk.ts           RLS-scoped client for the dashboard
  push.ts                     notifyAdvertiser() — sends web push, prunes stale subscriptions
  ip-hash.ts / device.ts / geo.ts   Scan-logging helpers
  admin.ts                    isAdmin() — the ADMIN_USER_IDS allowlist check
public/sw.js                  Service worker (push + notification click handling)
supabase/schema.sql           Tables + RLS policies
docs/privacy-policy.md        Source of truth for app/privacy/page.tsx
```

## Admin: creating ad slots

Go to `/admin` (signed in as a Clerk user listed in `ADMIN_USER_IDS`).
Pick the advertiser from the dropdown (pulled live from Clerk's user
list), fill in the business name, a URL-safe `code`, and their
destination URL, and submit — that's one `ad_slots` row, i.e. one QR
code. Each row gets a "Download" button that generates a PNG QR code
encoding `https://<your-domain>/r/<code>`, ready to hand to a printer.

An advertiser can have multiple ad slots (multiple postcard runs,
multiple locations) — just create another row with a different `code`
for the same advertiser; the dashboard already groups scans/leads per
slot.

`/admin` and `/api/admin/*` are gated two ways: `middleware.ts` requires
any signed-in session, and the page/route themselves additionally check
`isAdmin()` — being signed in isn't enough on its own, only Clerk user ids
listed in `ADMIN_USER_IDS` get in. Anyone else hitting `/admin` is bounced
to `/dashboard`.

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
- Fill in `[SERVICE AREA]`, `[EMAIL]`, and `[PHONE]` on the homepage
  (`app/page.tsx` — the "how it works" step, FAQ, CTA banner, and footer
  all reference these).
- Set `ADMIN_USER_IDS` so someone can actually reach `/admin` (see above).
  The sales pipeline tracking itself (contact info, pricing, follow-up
  dates) still lives outside this repo, in the advertiser tracker
  spreadsheet — `/admin` only handles the technical side, creating the
  `ad_slots` row and its QR code once a deal is closed.
