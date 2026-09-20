-- Either participant can cancel a locked trade before it completes.
--   * trades gains: who cancelled, why (a fixed set of reasons), and when. A cancelled trade
--     with no `cancelled_by` is one that timed out (release_expired_trades).
--   * Someone who has already confirmed payment can no longer walk away.
--   * What happens to the ad: if the poster cancels, their ad is closed; if the other side
--     cancels, the ad goes back on the market.

alter table public.trades
  add column if not exists cancelled_by uuid references public.users (id) on delete set null,
  add column if not exists cancel_reason text,
  add column if not exists cancelled_at timestamptz;

alter table public.trades drop constraint if exists trades_cancel_reason_check;
alter table public.trades
  add constraint trades_cancel_reason_check
  check (cancel_reason is null or cancel_reason in ('changed_mind', 'no_response', 'payment_issue', 'other'));

create or replace function public.cancel_trade(p_trade_id uuid, p_reason text default 'other')
returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trade public.trades;
  v_order public.orders;
  v_reason text := coalesce(nullif(trim(p_reason), ''), 'other');
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;

  if v_reason not in ('changed_mind', 'no_response', 'payment_issue', 'other') then
    v_reason := 'other';
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;

  if not found then
    raise exception 'trade not found';
  end if;

  if v_uid not in (v_trade.buyer_id, v_trade.seller_id) then
    raise exception 'not a participant';
  end if;

  if v_trade.status <> 'locked' then
    raise exception 'trade not active';
  end if;

  if (v_uid = v_trade.buyer_id and v_trade.buyer_confirmed)
     or (v_uid = v_trade.seller_id and v_trade.seller_confirmed) then
    raise exception 'already confirmed';
  end if;

  update public.trades
    set status = 'cancelled',
        cancelled_by = v_uid,
        cancel_reason = v_reason,
        cancelled_at = now()
    where id = p_trade_id
    returning * into v_trade;

  select * into v_order from public.orders where id = v_trade.order_id for update;

  if found then
    update public.orders
      set status = case when v_order.user_id = v_uid then 'cancelled' else 'open' end
      where id = v_order.id and status = 'locked';
  end if;

  return v_trade;
end;
$$;

revoke execute on function public.cancel_trade(uuid, text) from public, anon;
grant execute on function public.cancel_trade(uuid, text) to authenticated;
