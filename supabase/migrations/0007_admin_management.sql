-- Multi-admin support for the dashboard.
--   * role       : 'owner' can add / disable admins; 'admin' has the normal dashboard.
--   * is_active  : soft-disable an admin without deleting them (audit-log rows keep
--                  pointing at them, so they can't be hard-deleted).
--   * created_by : which admin added this one.
-- Admin accounts are always kept verified + subscription-active (see trigger below).

alter table public.admins
  add column if not exists role text not null default 'admin'
    check (role in ('owner', 'admin')),
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid references public.admins (id) on delete set null;

-- The earliest admin (the person who set the project up) becomes the owner.
update public.admins
  set role = 'owner'
  where id = (select id from public.admins order by created_at asc limit 1)
    and not exists (select 1 from public.admins where role = 'owner');

-- A disabled admin no longer passes RLS checks that use is_admin().
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins a where a.id = uid and a.is_active);
$$;

-- Whenever someone is added to `admins`, their trader profile is marked
-- verified + subscription-active (they can also trade, and it shows in the list).
create or replace function public.handle_new_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
    set verification_status = 'verified',
        rejection_reason = null,
        subscription_status = 'active',
        is_suspended = false
    where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_admin_created on public.admins;
create trigger on_admin_created
  after insert on public.admins
  for each row execute procedure public.handle_new_admin();

-- Backfill: existing admins get the same treatment.
update public.users
  set verification_status = 'verified',
      rejection_reason = null,
      subscription_status = 'active',
      is_suspended = false
  where id in (select id from public.admins);
