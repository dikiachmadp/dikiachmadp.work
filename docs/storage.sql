-- Setup Supabase Storage untuk gambar project.
-- Berada di luar migrasi Prisma karena schema `storage` dikelola Supabase.
-- Sudah diterapkan ke project produksi pada 2026-07-13; simpan sebagai
-- referensi bila perlu diterapkan ulang di project Supabase lain.

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

-- Baca publik (bucket public juga melayani URL /object/public/... via CDN).
create policy "Public read project-images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'project-images');

-- Upload/ubah/hapus hanya untuk user login (admin dashboard).
create policy "Authenticated insert project-images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images');

create policy "Authenticated update project-images" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images')
  with check (bucket_id = 'project-images');

create policy "Authenticated delete project-images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images');
