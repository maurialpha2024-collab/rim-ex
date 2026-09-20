-- Keep trade chat open after payment is confirmed.
-- Messages and attachments were only accepted while a trade was 'locked';
-- they are now also accepted once it is 'completed'. Cancelled (timed-out)
-- trades stay read-only.

drop policy if exists "chat_insert_participant" on public.chat_messages;

create policy "chat_insert_participant" on public.chat_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.trades t
      where t.id = trade_id
        and t.status in ('locked', 'completed')
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

drop policy if exists "trade_attachments_insert_participant" on storage.objects;

create policy "trade_attachments_insert_participant" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trade-attachments'
    and exists (
      select 1 from public.trades t
      where t.id::text = (storage.foldername(name))[1]
        and t.status in ('locked', 'completed')
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

-- The chat room and chat list subscribe to Realtime changes on these tables.
-- Make sure they are in the publication (no-op if already added).
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['chat_messages', 'trades'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end;
$$;
