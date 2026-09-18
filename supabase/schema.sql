-- Tri-State Local Mailer — schema + RLS
-- Run once in the Supabase SQL editor (or via the CLI) against a fresh project.

create extension if not exists pgcrypto;

-- One row per advertiser's printed QR code / postcard slot.
-- advertiser_id is the Clerk user id of the advertiser, e.g.
-- "user_3JWPHi2lBbTGzWAGUaFbSeaaj6U" — NOT a UUID, so it's stored as text.
-- Clerk is wired up in Supabase as a third-party auth provider, and RLS
-- below reads it back via auth.jwt()->>'sub' (auth.uid() won't work here:
-- it casts to uuid internally and would error on a Clerk id).
create table if not exists ad_slots (
  id uuid primary key default gen_random_uuid(),
  advertiser_id text not null,
  code text not null unique,
  business_name text not null,
  destination_url text not null,
  slot_type text not null default 'standard',
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

-- One row per QR scan. No raw IP is ever stored — only an HMAC hash
-- (lib/ip-hash.ts) and a city/region-level location, matching
-- docs/privacy-policy.md.
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  ad_slot_id uuid not null references ad_slots (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  ip_hash text,
  device_type text check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  city text,
  region text,
  country text
);

-- One row per opt-in submission on an advertiser's destination page.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  ad_slot_id uuid not null references ad_slots (id) on delete cascade,
  scan_id uuid references scans (id) on delete set null,
  name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- One row per browser/device an advertiser has enabled push notifications
-- on (public/sw.js + components/EnableNotificationsButton.tsx).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  advertiser_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists scans_ad_slot_id_idx on scans (ad_slot_id);
create index if not exists leads_ad_slot_id_idx on leads (ad_slot_id);
create index if not exists push_subscriptions_advertiser_id_idx on push_subscriptions (advertiser_id);

alter table scans enable row level security;
alter table leads enable row level security;
alter table ad_slots enable row level security;
alter table push_subscriptions enable row level security;

-- Advertisers can only read scans tied to their own ad_slots
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

create policy "Advertisers see own push subscriptions"
  on push_subscriptions for select
  using (advertiser_id = (auth.jwt() ->> 'sub'));

-- The redirect route (app/r/[code]/route.ts), the lead-capture endpoint
-- (app/api/leads/route.ts) and the push-subscribe endpoint
-- (app/api/push/subscribe/route.ts) all use the service-role key, which
-- bypasses RLS by design — they write scans/leads/subscriptions for
-- visitors and devices that aren't an authenticated advertiser at all.
-- RLS is what protects the *read* side, when the advertiser dashboard
-- queries Supabase directly through lib/supabase-clerk.ts.
