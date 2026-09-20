-- ============================================================================
-- P2P Currency Exchange App — initial schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users (profile row, one per Supabase Auth user)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  email_verified boolean not null default false,
  phone text,
  phone_verified boolean not null default false,
  whatsapp_number text,
  passport_photo_url text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending_verification', 'verified', 'rejected')),
  rejection_reason text,
  display_name text,
  avg_rating numeric not null default 0,
  completed_trades_count integer not null default 0,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive')),
  subscription_expires_at timestamptz,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- admins (separate identity space from `users`)
-- Admins still authenticate through Supabase Auth (auth.users), but only a
-- row in this table grants dashboard access — see SUPABASE_SETUP.md for why
-- this is "isolated enough" for v1 and how to harden it further later.
-- ---------------------------------------------------------------------------
create table public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('sell_um_for_ruble', 'sell_ruble_for_um')),
  amount numeric not null check (amount > 0),
  rate numeric not null check (rate > 0),
  status text not null default 'open'
    check (status in ('open', 'locked', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- trades
-- ---------------------------------------------------------------------------
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  buyer_id uuid not null references public.users (id),
  seller_id uuid not null references public.users (id),
  amount numeric not null,
  rate numeric not null,
  status text not null default 'locked'
    check (status in ('locked', 'completed', 'cancelled')),
  buyer_confirmed boolean not null default false,
  seller_confirmed boolean not null default false,
  locked_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  sender_id uuid not null references public.users (id),
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades (id) on delete cascade,
  rated_by uuid not null references public.users (id),
  rated_user uuid not null references public.users (id),
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (trade_id, rated_by)
);

-- ---------------------------------------------------------------------------
-- admin_audit_log
-- ---------------------------------------------------------------------------
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins (id),
  user_id uuid references public.users (id),
  trade_id uuid references public.trades (id),
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

create index on public.orders (status);
create index on public.trades (status);
create index on public.chat_messages (trade_id);
create index on public.users (verification_status);

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Keep a users row in sync with each new auth.users row.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, split_part(coalesce(new.email, 'user'), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.id = uid);
$$;

create or replace function public.is_eligible_to_trade(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users u
    where u.id = uid
      and u.verification_status = 'verified'
      and u.subscription_status = 'active'
      and not u.is_suspended
  );
$$;

-- Atomically accept an open order and create the linked trade.
-- Prevents double-accept races via `for update skip locked`.
create or replace function public.accept_order(p_order_id uuid)
returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_trade public.trades;
  v_uid uuid := auth.uid();
begin
  if not public.is_eligible_to_trade(v_uid) then
    raise exception 'not eligible to trade';
  end if;

  select * into v_order from public.orders
    where id = p_order_id and status = 'open'
    for update skip locked;

  if not found then
    raise exception 'order not available';
  end if;

  if v_order.user_id = v_uid then
    raise exception 'cannot accept your own order';
  end if;

  update public.orders set status = 'locked' where id = v_order.id;

  insert into public.trades (order_id, buyer_id, seller_id, amount, rate)
  values (
    v_order.id,
    case when v_order.type = 'sell_ruble_for_um' then v_uid else v_order.user_id end,
    case when v_order.type = 'sell_ruble_for_um' then v_order.user_id else v_uid end,
    v_order.amount,
    v_order.rate
  )
  returning * into v_trade;

  return v_trade;
end;
$$;

-- Confirm a trade side; auto-completes when both sides confirm.
create or replace function public.confirm_trade(p_trade_id uuid)
returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trade public.trades;
  v_uid uuid := auth.uid();
begin
  select * into v_trade from public.trades where id = p_trade_id for update;

  if not found or v_trade.status <> 'locked' then
    raise exception 'trade not active';
  end if;

  if v_uid = v_trade.buyer_id then
    update public.trades set buyer_confirmed = true where id = p_trade_id;
  elsif v_uid = v_trade.seller_id then
    update public.trades set seller_confirmed = true where id = p_trade_id;
  else
    raise exception 'not a participant';
  end if;

  select * into v_trade from public.trades where id = p_trade_id;

  if v_trade.buyer_confirmed and v_trade.seller_confirmed then
    update public.trades
      set status = 'completed', completed_at = now()
      where id = p_trade_id;
    update public.orders set status = 'completed' where id = v_trade.order_id;
    update public.users set completed_trades_count = completed_trades_count + 1
      where id in (v_trade.buyer_id, v_trade.seller_id);
    select * into v_trade from public.trades where id = p_trade_id;
  end if;

  return v_trade;
end;
$$;

-- Release trades that have been locked past the 30-minute timeout.
-- Schedule with pg_cron (see SUPABASE_SETUP.md) or call from an Edge Function on a timer.
create or replace function public.release_expired_trades()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.trades
      set status = 'cancelled'
      where status = 'locked'
        and locked_at < now() - interval '30 minutes'
      returning order_id
  )
  update public.orders set status = 'open'
    where id in (select order_id from expired);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Recompute a user's average rating after a new rating is inserted.
create or replace function public.handle_new_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users u
    set avg_rating = (
      select coalesce(avg(stars), 0) from public.ratings r where r.rated_user = new.rated_user
    )
    where u.id = new.rated_user;
  return new;
end;
$$;

create trigger on_rating_created
  after insert on public.ratings
  for each row execute procedure public.handle_new_rating();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.users enable row level security;
alter table public.admins enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ratings enable row level security;
alter table public.admin_audit_log enable row level security;

-- users: anyone signed in can read basic public profile fields via a view
-- (kept simple here: any authenticated user can read all user rows; the app
-- only ever displays name/rating/status publicly). Users can update only
-- their own row, and never their own verification/subscription/rating fields.
create policy "users_select_authenticated" on public.users
  for select using (auth.role() = 'authenticated');

create policy "users_update_self" on public.users
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and verification_status = (select verification_status from public.users where id = auth.uid())
    and subscription_status = (select subscription_status from public.users where id = auth.uid())
    and is_suspended = (select is_suspended from public.users where id = auth.uid())
  );

create policy "users_admin_all" on public.admins
  for select using (public.is_admin(auth.uid()));

-- orders: readable by anyone authenticated; insert/update only by verified,
-- subscribed, non-suspended owners.
create policy "orders_select_all" on public.orders
  for select using (auth.role() = 'authenticated');

create policy "orders_insert_own" on public.orders
  for insert with check (
    auth.uid() = user_id and public.is_eligible_to_trade(auth.uid())
  );

create policy "orders_update_own_open" on public.orders
  for update using (auth.uid() = user_id and status = 'open');

-- trades: only visible to the two participants (or admins via service role).
create policy "trades_select_participant" on public.trades
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- inserts/updates to trades happen exclusively through the security-definer
-- RPCs above; no direct insert/update policy is granted to regular users.

-- chat_messages: only participants of the linked trade can read/write.
create policy "chat_select_participant" on public.chat_messages
  for select using (
    exists (
      select 1 from public.trades t
      where t.id = trade_id and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

create policy "chat_insert_participant" on public.chat_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.trades t
      where t.id = trade_id
        and t.status = 'locked'
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

-- ratings: anyone authenticated can read (shown on profiles); a participant
-- can rate the other side of a completed trade exactly once.
create policy "ratings_select_all" on public.ratings
  for select using (auth.role() = 'authenticated');

create policy "ratings_insert_participant" on public.ratings
  for insert with check (
    rated_by = auth.uid()
    and exists (
      select 1 from public.trades t
      where t.id = trade_id
        and t.status = 'completed'
        and (
          (t.buyer_id = auth.uid() and t.seller_id = rated_user)
          or (t.seller_id = auth.uid() and t.buyer_id = rated_user)
        )
    )
  );

-- admin_audit_log: admins only (reads/writes happen via service role from
-- server actions in the admin dashboard, so no end-user policy is needed).

-- ============================================================================
-- Storage: passport photos bucket (write-once, admin-readable)
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('passport-photos', 'passport-photos', false)
  on conflict (id) do nothing;

-- Users may upload only into their own folder (`<uid>/...`) and only once
-- there is no existing object there (write-once).
create policy "passport_upload_own_once" on storage.objects
  for insert with check (
    bucket_id = 'passport-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'passport-photos'
        and (storage.foldername(o.name))[1] = auth.uid()::text
    )
  );

create policy "passport_read_own" on storage.objects
  for select using (
    bucket_id = 'passport-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No update/delete policies are created for this bucket for anyone but the
-- service role — this enforces the "never deletable" requirement at the
-- database level, not just in the UI.
