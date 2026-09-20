-- Adds photo/voice-note support to trade chat.

alter table public.chat_messages
  add column if not exists message_type text not null default 'text'
    check (message_type in ('text', 'image', 'audio')),
  add column if not exists attachment_path text;

alter table public.chat_messages
  alter column message drop not null;

-- A text message must have text; an attachment message must have a path.
alter table public.chat_messages
  add constraint chat_messages_content_check
  check (
    (message_type = 'text' and message is not null)
    or (message_type in ('image', 'audio') and attachment_path is not null)
  );

insert into storage.buckets (id, name, public)
  values ('trade-attachments', 'trade-attachments', false)
  on conflict (id) do nothing;

-- Objects live at `<trade_id>/<sender_id>-<timestamp>.<ext>`. Only the two
-- participants of that trade may upload or read, and only while it's locked
-- (mirrors the chat_messages insert policy).
create policy "trade_attachments_insert_participant" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trade-attachments'
    and exists (
      select 1 from public.trades t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.status = 'locked'
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

create policy "trade_attachments_read_participant" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'trade-attachments'
    and exists (
      select 1 from public.trades t
      where t.id = (storage.foldername(name))[1]::uuid
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );
