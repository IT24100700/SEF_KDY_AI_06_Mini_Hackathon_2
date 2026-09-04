-- ─────────────────────────────────────────────────────────────
--  HelpSriLanka — user profiles
--
--  Run AFTER db/schema.sql, in the Supabase SQL Editor (or via the
--  migration runner). Safe to re-run.
--
--  WHY THIS FILE EXISTS
--  --------------------
--  Supabase Auth already stores accounts in auth.users, and
--  backend/routes/auth.js writes the signup form's extra fields into
--  that row's user_metadata. That is enough to register and to log in
--  by email, but it leaves two real gaps:
--
--    1. user_metadata is a schemaless JSON blob. Two people can take the
--       same username or register the same mobile number and nothing
--       stops them.
--    2. Login.jsx lets you sign in with a mobile number. Resolving that
--       number to an email meant calling auth.admin.listUsers(), which
--       only works with the service-role key — so with the anon key the
--       lookup silently returned nothing and every mobile login failed
--       with "No account found for that mobile number."
--
--  public.profiles fixes both: it mirrors auth.users into a real table
--  with real constraints, and the lookup becomes an ordinary query.
--
--  Profiles are NOT world-readable — they hold emails, phone numbers and
--  home addresses. RLS restricts them to the owner. The two operations
--  an anonymous visitor legitimately needs (resolve a login identifier,
--  check whether a username is free) are exposed as narrow SECURITY
--  DEFINER functions that return only what those jobs require.
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
--  Helper: canonical mobile format
-- ═════════════════════════════════════════════════════════════
--
-- Signup.jsx accepts both '0771234567' and '+94771234567'. Storing them
-- verbatim would let the same phone register twice and would break
-- lookups. Everything is normalised to the +94 form on the way in and on
-- the way back out.

create or replace function public.normalise_mobile(m text)
returns text
language sql
immutable
as $$
  select case
    when m is null or btrim(m) = '' then null
    when regexp_replace(m, '\s', '', 'g') like '0%'
      then '+94' || substr(regexp_replace(m, '\s', '', 'g'), 2)
    else regexp_replace(m, '\s', '', 'g')
  end
$$;


-- ═════════════════════════════════════════════════════════════
--  profiles
-- ═════════════════════════════════════════════════════════════
--
-- One row per auth.users row. The id IS the auth user id, so a profile
-- can never drift from the account it describes, and deleting the
-- account deletes the profile.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  -- ── Step 1 of the signup form ────────────────────────────
  full_name  text not null,
  username   text not null unique,
  email      text not null unique,
  mobile     text unique,

  -- ── Step 2 of the signup form ────────────────────────────
  address_line1 text,
  address_line2 text,
  city          text,
  district      text,
  province      text
);

-- Lookups by login identifier hit these.
create index if not exists profiles_mobile_idx   on public.profiles (mobile);
create index if not exists profiles_username_idx on public.profiles (lower(username));


-- ═════════════════════════════════════════════════════════════
--  Keep profiles in step with auth.users
-- ═════════════════════════════════════════════════════════════
--
-- Runs on every new account, whether it was created through our Express
-- API, the Supabase JS client, or by hand in the dashboard — so a
-- profile can never be missing.
--
-- The username fallback matters: a dashboard-created user has no
-- metadata, and a null username would violate NOT NULL and abort the
-- account creation itself.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, username, email, mobile,
    address_line1, address_line2, city, district, province
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      'user_' || left(new.id::text, 8)
    ),
    new.email,
    public.normalise_mobile(new.raw_user_meta_data ->> 'mobile'),
    new.raw_user_meta_data ->> 'address_line1',
    new.raw_user_meta_data ->> 'address_line2',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'district',
    new.raw_user_meta_data ->> 'province'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ═════════════════════════════════════════════════════════════
--  Login support
-- ═════════════════════════════════════════════════════════════

-- Resolve a login identifier (mobile number or username) to the email
-- Supabase Auth expects. Returns exactly one column — the email — and
-- nothing else about the account, so granting it to anon does not expose
-- the profile table.
--
-- SECURITY DEFINER so it can read past the owner-only RLS policy below.

create or replace function public.email_for_identifier(identifier text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.email
  from public.profiles p
  where p.mobile = public.normalise_mobile(identifier)
     or lower(p.username) = lower(btrim(identifier))
  limit 1
$$;

-- Lets the signup form fail fast with "that username is taken" instead
-- of bouncing off a unique-constraint violation deep inside the insert,
-- which surfaces to the user as an unhelpful database error.
--
-- Returns only two booleans — never who holds the name.

create or replace function public.signup_availability(p_username text, p_mobile text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'usernameTaken', exists (
      select 1 from public.profiles
      where lower(username) = lower(btrim(coalesce(p_username, '')))
    ),
    'mobileTaken', exists (
      select 1 from public.profiles
      where mobile is not null
        and mobile = public.normalise_mobile(p_mobile)
    )
  )
$$;

revoke all on function public.email_for_identifier(text) from public;
revoke all on function public.signup_availability(text, text) from public;
grant execute on function public.email_for_identifier(text) to anon, authenticated;
grant execute on function public.signup_availability(text, text) to anon, authenticated;


-- ═════════════════════════════════════════════════════════════
--  Row Level Security
-- ═════════════════════════════════════════════════════════════
--
-- Unlike items / feedback / donations, this table is private. It holds
-- home addresses and phone numbers, so there is no anon read policy —
-- you can only ever see your own row. Anonymous visitors reach the two
-- functions above instead.

alter table public.profiles enable row level security;

drop policy if exists "users read their own profile" on public.profiles;
create policy "users read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy on purpose: rows arrive through the trigger above,
-- which runs as SECURITY DEFINER. Nobody inserts a profile by hand.


-- ═════════════════════════════════════════════════════════════
--  Backfill
-- ═════════════════════════════════════════════════════════════
--
-- Accounts registered before this file was applied have no profile.
-- This catches them up. Idempotent.

insert into public.profiles (
  id, full_name, username, email, mobile,
  address_line1, address_line2, city, district, province
)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'username', ''),
    'user_' || left(u.id::text, 8)
  ),
  u.email,
  public.normalise_mobile(u.raw_user_meta_data ->> 'mobile'),
  u.raw_user_meta_data ->> 'address_line1',
  u.raw_user_meta_data ->> 'address_line2',
  u.raw_user_meta_data ->> 'city',
  u.raw_user_meta_data ->> 'district',
  u.raw_user_meta_data ->> 'province'
from auth.users u
where u.email is not null
on conflict (id) do nothing;
