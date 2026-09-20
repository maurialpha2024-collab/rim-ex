-- Users can't update verification_status directly (see users_update_self policy
-- in 0001) — that's intentional, it stops self-verification. This RPC is the
-- one controlled path a user has to submit for review.
create or replace function public.submit_verification(p_whatsapp text, p_photo_path text)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user public.users;
begin
  select * into v_user from public.users where id = v_uid for update;

  if not found then
    raise exception 'no profile for current user';
  end if;

  if v_user.verification_status = 'pending_verification' then
    raise exception 'already pending review';
  end if;

  if v_user.verification_status = 'verified' then
    raise exception 'already verified';
  end if;

  update public.users
    set whatsapp_number = p_whatsapp,
        passport_photo_url = coalesce(passport_photo_url, p_photo_path),
        verification_status = 'pending_verification',
        rejection_reason = null
    where id = v_uid
    returning * into v_user;

  return v_user;
end;
$$;
