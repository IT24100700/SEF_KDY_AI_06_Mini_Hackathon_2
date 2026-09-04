-- ─────────────────────────────────────────────────────────────
--  HelpSriLanka — `feedback` table
--
--  Backs frontend/src/pages/Feedback.jsx.
--  Run once in the Supabase dashboard: SQL Editor → New query → Run.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Name of the person leaving feedback, and which side of the
  -- relief effort they were on.
  name       text not null,
  role       text not null default 'requester'
             check (role in ('requester', 'donor')),

  location   text not null,                       -- Sri Lankan district
  rating     smallint not null check (rating between 1 and 5),
  message    text not null check (char_length(message) between 10 and 1000)
);

-- The board is sorted newest-first.
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

-- ─── Row Level Security ──────────────────────────────────────
-- Disaster feedback has to work for anonymous citizens, so the anon
-- role may insert and read. It may NOT update or delete: feedback is
-- append-only, which is what makes the dispatch log tamper-evident.

alter table public.feedback enable row level security;

drop policy if exists "anyone can leave feedback" on public.feedback;
create policy "anyone can leave feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone can read feedback" on public.feedback;
create policy "anyone can read feedback"
  on public.feedback for select
  to anon, authenticated
  using (true);
