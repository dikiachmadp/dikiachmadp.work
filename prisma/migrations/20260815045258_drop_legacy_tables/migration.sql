-- Menghapus sepuluh tabel snake_case dari era sebelum Prisma.
--
-- Kenapa sekarang: selama tabel-tabel ini ada, `prisma migrate diff` selalu
-- mengusulkan `DROP TABLE` untuk kesepuluhnya — semata karena mereka tidak ada
-- di schema.prisma. Artinya keluaran perintah itu tidak pernah aman disimpan
-- mentah sebagai berkas migrasi, dan setiap perubahan skema berikutnya harus
-- menyaringnya lagi dengan tangan. Migrasi ini menutup jebakan itu.
--
-- Diaudit lebih dulu (2026-08-15), bukan diasumsikan:
--
--   kosong          contact_messages, experiments, logbook_posts, products
--   projects (12)   himpunan slug-nya identik dengan "Project"; nol tanpa pasangan
--   social_links (7) ketujuh URL ada di src/content/{en,id}/siteConfig.json
--   services (6)    keenamnya ada di src/content/{en,id}/services.json
--   testimonials (5) kelimanya ada di "Testimonial" (6 EN + 6 ID)
--   profile (1)     nama/headline/lokasi ada di siteConfig.json + pageHeader.json
--   site_settings (1) contact_email dan site_url ada; hero_heading sudah ditulis ulang
--
-- Nol rujukan di kode: tidak ada `.from()` Supabase maupun raw SQL yang
-- menyentuhnya. Nol foreign key ke dua arah, nol view yang bergantung — jadi
-- tidak perlu CASCADE, dan urutannya tidak berpengaruh. Policy RLS dan indeks
-- masing-masing tabel ikut terhapus bersama tabelnya.
--
-- Cadangan lengkap (definisi kolom + seluruh baris) diambil sebelum migrasi ini
-- dijalankan dan diserahkan ke pemilik repo. Tidak ikut disimpan di repo:
-- isinya jejak konten lama, dan repo bukan tempat menyimpan cadangan basis data.
--
-- Catatan temuan yang tidak diperbaiki di sini: baris legacy `website-ekonomi`
-- menyimpan galeri dua gambar yang tidak pernah ikut bermigrasi ke "Project" —
-- tapi berkasnya (webep-gallery1/2.webp) juga sudah tidak ada di public/, jadi
-- yang hilang di sini hanyalah rujukan yang menggantung.

DROP TABLE IF EXISTS "contact_messages";
DROP TABLE IF EXISTS "experiments";
DROP TABLE IF EXISTS "logbook_posts";
DROP TABLE IF EXISTS "products";
DROP TABLE IF EXISTS "profile";
DROP TABLE IF EXISTS "projects";
DROP TABLE IF EXISTS "services";
DROP TABLE IF EXISTS "site_settings";
DROP TABLE IF EXISTS "social_links";
DROP TABLE IF EXISTS "testimonials";
