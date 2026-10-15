-- Swasth Setu: profiles, roles, reminders, notes. Row-level security on everything.
-- Apply with the Supabase CLI (supabase db push) or paste into the SQL editor.

create type public.app_role as enum ('user', 'doctor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

-- Every new auth user gets a 'user' profile. Roles are NEVER taken from client input.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role) values (new.id, 'user');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.current_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

alter table public.profiles enable row level security;

-- A user may read their own profile. Nobody can update or insert profiles through the API:
-- promote doctors/admins with the service role or the SQL editor after a real verification process.
create policy "read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "admins read profiles" on public.profiles for select to authenticated
  using ((select public.current_role()) = 'admin');

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  kind text not null check (char_length(kind) <= 60),
  due date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index reminders_user_idx on public.reminders (user_id);
create index notes_user_idx on public.notes (user_id);

alter table public.reminders enable row level security;
alter table public.notes enable row level security;

-- Owner-only access. Doctors and admins get NO access to other users' personal notes or reminders.
create policy "own reminders" on public.reminders for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own notes" on public.notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
