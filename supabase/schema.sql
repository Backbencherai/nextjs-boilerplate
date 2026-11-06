-- A×D Universe — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- Privacy model: every row belongs to a "space" = SHA-256 of the secret space code
-- you both type during onboarding. The app sends that hash in an `x-space-key`
-- request header, and Row Level Security only exposes rows whose `space` matches
-- the header. Without the code, the anon key can read or write nothing.

create table if not exists public.activities (
  id uuid primary key,
  space text not null check (char_length(space) = 64),
  player text not null check (player in ('adarsh', 'devanshi')),
  kind text not null,
  at timestamptz not null,
  minutes numeric,
  data jsonb not null default '{}'::jsonb,
  xp integer not null default 0 check (xp between 0 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists activities_space_at on public.activities (space, at);

alter table public.activities enable row level security;

create or replace function public.request_space() returns text
language sql stable as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-space-key', '')
$$;

drop policy if exists "space read" on public.activities;
drop policy if exists "space insert" on public.activities;
drop policy if exists "space update" on public.activities;
drop policy if exists "space delete" on public.activities;

create policy "space read" on public.activities
  for select using (space = public.request_space());
create policy "space insert" on public.activities
  for insert with check (space = public.request_space());
create policy "space update" on public.activities
  for update using (space = public.request_space()) with check (space = public.request_space());
create policy "space delete" on public.activities
  for delete using (space = public.request_space());

-- Live updates use Supabase Realtime *broadcast* + *presence* on a channel named
-- after the space hash, so nothing else needs enabling.
