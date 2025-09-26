-- Storage setup for match proof uploads
-- Creates the 'match-proofs' bucket and RLS policies to allow
-- authenticated users to upload files in their own user-id folder.

-- 1) Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('match-proofs', 'match-proofs', true)
on conflict (id) do nothing;

-- 2) Policies on storage.objects
-- Enable RLS (usually enabled by default on storage.objects, but safe to ensure)
alter table if exists storage.objects enable row level security;

-- Allow public read (bucket is public; CDN access will work regardless, but SELECT
-- helps for listing via API if you need it). Adjust to your needs.
create policy if not exists "match-proofs: public read"
  on storage.objects for select
  using (bucket_id = 'match-proofs');

-- Allow authenticated users to upload into their own folder: <uid>/...
create policy if not exists "match-proofs: auth insert to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'match-proofs'
    and name like auth.uid()::text || '/%'
  );

-- Allow owners to update their own objects (optional)
create policy if not exists "match-proofs: owner can update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'match-proofs'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'match-proofs'
    and owner = auth.uid()
  );

-- Allow owners to delete their own objects (optional)
create policy if not exists "match-proofs: owner can delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'match-proofs'
    and owner = auth.uid()
  );
