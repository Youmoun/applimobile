
-- Schéma Supabase pour Prestataires
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  city text not null,
  phone text not null,
  photo_url text,
  about text,
  categories text[] not null default '{}',
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
  created_at timestamptz default now()
);

alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.ratings enable row level security;

create policy "providers_select" on public.providers for select using (true);
create policy "providers_insert" on public.providers for insert with check (true);

create policy "services_select" on public.services for select using (true);
create policy "services_insert" on public.services for insert with check (true);

create policy "ratings_select" on public.ratings for select using (true);
create policy "ratings_insert" on public.ratings for insert with check (true);
