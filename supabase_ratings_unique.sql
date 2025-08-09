do $$
begin
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='ratings_provider_user_unique') then
    create unique index ratings_provider_user_unique on public.ratings(provider_id, user_id);
  end if;
end $$;
drop policy if exists ratings_update_self on public.ratings;
create policy ratings_update_self on public.ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
