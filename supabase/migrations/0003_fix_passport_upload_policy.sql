-- The old insert policy queried storage.objects for an existing file in the
-- user's folder. After any earlier upload (e.g. one whose submit_verification
-- call failed) every retry was rejected with "new row violates row-level
-- security policy". Write-once is now enforced by a fixed object name
-- (`<uid>/passport`) plus the unique (bucket_id, name) constraint with
-- upsert:false. No update/delete policies exist, so it stays undeletable.
drop policy if exists "passport_upload_own_once" on storage.objects;

create policy "passport_upload_own_once" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'passport-photos'
    and name = auth.uid()::text || '/passport'
  );
