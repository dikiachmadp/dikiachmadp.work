-- Halaman jualan berhenti jadi template delapan slot bernama dan jadi daftar
-- blok berurutan; kontrak bentuknya pindah ke src/schemas/product-blocks.ts.
--
-- Destruktif dengan sengaja, bukan karena kelalaian: tabelnya kosong (nol
-- produk, nol terjemahan) saat migrasi ini ditulis, jadi tidak ada satu pun
-- baris `landing` yang hilang. "Order" tidak disentuh sama sekali — tanda
-- terima lama tetap terbuka di /{locale}/orders/{token}.
--
-- Urutan penerapan: migrasikan dulu, deploy kode belakangan. Kode baru tidak
-- bisa membaca kolom yang belum ada, sedangkan kode lama tahan terhadap kolom
-- yang tidak dikenalnya.
ALTER TABLE "DigitalProduct" DROP COLUMN "landing";
ALTER TABLE "DigitalProduct" ADD COLUMN "blocks" JSONB NOT NULL DEFAULT '[]';

-- Tautan pratinjau/demo produk. Kosong berarti tombolnya tidak dirender sama
-- sekali, bukan dirender sebagai tautan mati.
ALTER TABLE "DigitalProduct" ADD COLUMN "demoUrl" TEXT;

-- "Apa yang kamu dapat" pindah ke produk itu sendiri, jadi tidak lagi
-- bergantung pada adanya paket yang ditandai `recommended`.
ALTER TABLE "DigitalProductTranslation"
  ADD COLUMN "deliverables" TEXT[] NOT NULL DEFAULT '{}';
