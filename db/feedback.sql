-- ─────────────────────────────────────────────────────────────
--  HelpSriLanka — `feedback` table
--
--  Backs frontend/src/pages/Feedback.jsx.
--  Run once in the Supabase dashboard: SQL Editor → New query → Run.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name       text not null,
  contact    text,                       -- optional phone or email for callback
  district   text not null,

  category   text not null
             check (category in ('incident', 'platform', 'volunteer', 'complaint')),

  -- Set only for category = 'incident'
  urgency    text check (urgency in ('low', 'medium', 'high', 'critical')),

  -- Set only for category = 'platform'
  rating     smallint check (rating between 1 and 5),

  message    text not null check (char_length(message) between 15 and 1000)
);

-- The board is sorted newest-first and filtered by category.
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_category_idx   on public.feedback (category);

-- ─── Row Level Security ──────────────────────────────────────
-- Disaster reporting has to work for anonymous citizens, so the anon
-- role may insert and read. It may NOT update or delete: reports are
-- append-only, which is what makes the dispatch log tamper-evident.

alter table public.feedback enable row level security;

drop policy if exists "anyone can file feedback" on public.feedback;
create policy "anyone can file feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone can read feedback" on public.feedback;
create policy "anyone can read feedback"
  on public.feedback for select
  to anon, authenticated
  using (true);
