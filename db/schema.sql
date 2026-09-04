-- ─────────────────────────────────────────────────────────────
--  HelpSriLanka — full database schema
--
--  Run once in the Supabase dashboard: SQL Editor → New query → Run.
--  Safe to re-run: every statement is idempotent.
--
--  Tables
--    public.items      — aid requests & donation pledges (the browser
--                        talks to this one directly via the anon key)
--    public.feedback   — citizen / relief-team feedback board
--    public.donations  — physical consignment donations, written and read
--                        through the Express API rather than the browser
--
--  Column names are dictated by the frontend, which is already written:
--    items      → RequestForm.jsx (insert), RequestList.jsx (read), Home.jsx (stats)
--    feedback   → Feedback.jsx
--    donations  → backend/routes/donations.js, consumed by DonateForm.jsx
--                 and DonationList.jsx
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
--  items
-- ═════════════════════════════════════════════════════════════
--
-- RequestForm.jsx only ever inserts the six base columns (type, name,
-- contact, location, category, description). RequestList.jsx reads
-- `select *` and falls back through a chain of richer, optional columns
-- (title, district, urgency, …) when they are present. Both sets live
-- here so a hand-written dispatch record renders in full detail while a
-- plain form submission still renders correctly on the fallbacks.

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- 'request' = someone needs aid, 'donation' = someone is offering it.
  -- RequestList.jsx matches both cases, so accept either.
  type        text not null check (lower(type) in ('request', 'donation')),

  -- ── Base columns written by RequestForm.jsx ──────────────
  name        text not null,
  contact     text,
  location    text,
  category    text,
  description text,

  -- ── Optional dispatch columns read by RequestList.jsx ────
  -- Each of these has a fallback in the frontend, so leaving them null
  -- on a form submission is fine.
  token              text,
  title              text,
  district           text,
  ds_division        text,
  shelter_name       text,
  landmark           text,
  contact_name       text,
  contact_phone      text,
  quantity_or_people integer,
  supplies_needed    text,
  urgency            text,
  dispatch_tag       text,
  notes              text,

  -- RequestList.jsx buckets anything that is not 'Done'/'Fulfilled'
  -- into 'Pending', so this stays deliberately permissive.
  status      text not null default 'Pending'
);

create index if not exists items_created_at_idx on public.items (created_at desc);
create index if not exists items_type_idx       on public.items (lower(type));


-- ═════════════════════════════════════════════════════════════
--  feedback
-- ═════════════════════════════════════════════════════════════
--
-- Unchanged from db/feedback.sql — repeated here so this one file is the
-- complete setup. Running both files is harmless.

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name       text not null,
  role       text not null default 'requester'
             check (role in ('requester', 'donor')),

  location   text not null,
  rating     smallint not null check (rating between 1 and 5),
  message    text not null check (char_length(message) between 10 and 1000)
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);


-- ═════════════════════════════════════════════════════════════
--  donations
-- ═════════════════════════════════════════════════════════════
--
-- DonateForm.jsx posts a nested { donor, items, totalUnits } payload and
-- DonationList.jsx reads the same shape back. The API layer flattens the
-- donor object into columns (so it stays queryable) and keeps the pledged
-- line items as jsonb, since they are an opaque list to the database.

create table if not exists public.donations (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- ── Donor block ──────────────────────────────────────────
  donor_name      text not null,
  donor_phone     text not null,
  donor_email     text not null,
  donor_anonymous boolean not null default false,
  donor_drop_off  text,
  donor_notes     text,

  -- ── Consignment ──────────────────────────────────────────
  -- [{ "itemId": "rice-10kg", "quantity": 4 }, ...]
  items            jsonb   not null default '[]'::jsonb,
  additional_items text,
  total_units      integer not null default 0 check (total_units >= 0),

  -- The three values DonationList.jsx renders badges for.
  status     text not null default 'Pending'
             check (status in ('Pending', 'Dispatched', 'Delivered'))
);

create index if not exists donations_created_at_idx on public.donations (created_at desc);
create index if not exists donations_status_idx     on public.donations (status);


-- ═════════════════════════════════════════════════════════════
--  Row Level Security
-- ═════════════════════════════════════════════════════════════
--
-- This is a disaster-response tool: an affected citizen has to be able to
-- file a request and read the boards without an account, so the anon role
-- gets read + insert everywhere.
--
-- NOTE ON donations UPDATE/DELETE: the anon role is granted these so that
-- a backend running with the *anon* key can serve the PATCH and DELETE
-- handlers DonationList.jsx calls. That also means anyone holding the
-- public anon key could change or cancel a pledge directly. Before this
-- goes in front of real users, give the backend a service-role key (it
-- bypasses RLS entirely) and drop the last two policies in this file.

alter table public.items     enable row level security;
alter table public.feedback  enable row level security;
alter table public.donations enable row level security;

-- ── items ────────────────────────────────────────────────────
drop policy if exists "anyone can read items" on public.items;
create policy "anyone can read items"
  on public.items for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can file a request" on public.items;
create policy "anyone can file a request"
  on public.items for insert
  to anon, authenticated
  with check (true);

-- ── feedback ─────────────────────────────────────────────────
-- Append-only: no update or delete policy, which is what makes the
-- dispatch log tamper-evident.
drop policy if exists "anyone can read feedback" on public.feedback;
create policy "anyone can read feedback"
  on public.feedback for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can leave feedback" on public.feedback;
create policy "anyone can leave feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

-- ── donations ────────────────────────────────────────────────
drop policy if exists "anyone can read donations" on public.donations;
create policy "anyone can read donations"
  on public.donations for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can pledge a donation" on public.donations;
create policy "anyone can pledge a donation"
  on public.donations for insert
  to anon, authenticated
  with check (true);

-- See the NOTE above before keeping these two in production.
drop policy if exists "anyone can update a donation" on public.donations;
create policy "anyone can update a donation"
  on public.donations for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "anyone can cancel a donation" on public.donations;
create policy "anyone can cancel a donation"
  on public.donations for delete
  to anon, authenticated
  using (true);
