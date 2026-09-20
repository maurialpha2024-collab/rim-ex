-- The trade room shows the counterparty's rating as soon as it is submitted,
-- so `ratings` needs to be in the Realtime publication (no-op if already added).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ratings'
     ) then
    alter publication supabase_realtime add table public.ratings;
  end if;
end;
$$;
