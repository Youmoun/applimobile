
-- Extensions utiles
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

-- Tables
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  city text not null,
  phone text not null,
  photo_url text,
  about text,
  categories text[] not null default '{}',
  latitude double precision,
  longitude double precision,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade not null,
  name text not null,
  price numeric not null
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade not null,
  stars int not null check (stars between 1 and 5),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- RLS
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.ratings enable row level security;

-- Policies: lecture publique
create policy if not exists providers_select on public.providers for select using (true);
create policy if not exists services_select on public.services for select using (true);
create policy if not exists ratings_select on public.ratings for select using (true);

-- Policies: insertion réservée aux utilisateurs authentifiés
create policy if not exists providers_insert_auth on public.providers
  for insert to authenticated with check (auth.uid() is not null);

create policy if not exists services_insert_auth on public.services
  for insert to authenticated with check (auth.uid() is not null);

create policy if not exists ratings_insert_auth on public.ratings
  for insert to authenticated with check (auth.uid() is not null);
