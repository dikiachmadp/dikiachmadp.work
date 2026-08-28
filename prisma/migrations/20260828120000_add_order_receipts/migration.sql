-- Tanda terima bermerek untuk setiap transaksi.
--
-- Polar tetap merchant of record dan tetap menerbitkan invoice pajaknya
-- sendiri; yang ditambahkan di sini adalah dokumen tanda terima atas nama
-- dikiachmadp.work | Digital Products, beserta yang dibutuhkan untuk
-- menerbitkannya: nomor yang bisa dibaca manusia, token rahasia untuk
-- mengaksesnya, cuplikan judul produk, bahasa pembeli, dan penanda kirim.
--
-- Kolomnya ditambahkan sebagai nullable / berdefault lebih dulu lalu diisi
-- mundur, baru dijadikan NOT NULL. Tabel ini bisa sudah berisi transaksi
-- sungguhan, dan menambah kolom NOT NULL tanpa default akan menggagalkan
-- migrasi di produksi sementara berhasil di basis data yang masih kosong.

-- Penghitung nomor tanda terima. Berlanjut lintas tahun: tahun pada nomor
-- hanya awalan, bukan penghitung yang di-nol-kan tiap Januari — nomor yang
-- sudah terbit tidak boleh bisa terbit dua kali.
CREATE SEQUENCE IF NOT EXISTS "Order_number_seq" START 1;

ALTER TABLE "Order"
  ADD COLUMN "orderNumber"   TEXT,
  ADD COLUMN "receiptToken"  TEXT,
  ADD COLUMN "productTitle"  TEXT NOT NULL DEFAULT '',
  ADD COLUMN "locale"        TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "receiptSentAt" TIMESTAMP(3);

-- Nomor dan token diberikan Postgres, bukan kode aplikasi. Dengan begitu
-- keduanya hanya pernah muncul di jalur INSERT: webhook Polar yang datang
-- berulang menjalankan UPDATE, dan UPDATE secara struktural tidak mungkin
-- menyentuh kolom ini. Tautan tanda terima yang sudah ada di kotak masuk
-- pembeli karena itu tidak bisa berubah di belakang punggungnya.
--
-- `gen_random_uuid()` di PostgreSQL 13+ mengambil dari CSPRNG, jadi 122 bit
-- yang dihasilkannya memang layak dipakai sebagai rahasia.
ALTER TABLE "Order"
  ALTER COLUMN "orderNumber" SET DEFAULT ('DAP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('"Order_number_seq"')::text, 4, '0')),
  ALTER COLUMN "receiptToken" SET DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Isi mundur baris yang sudah ada. Diurutkan menurut createdAt supaya nomor
-- transaksi lama tetap sejalan dengan urutan kejadiannya; tahun pada nomor
-- diambil dari tanggal transaksinya sendiri, bukan tanggal migrasi ini.
UPDATE "Order" AS o
SET
  "orderNumber" = 'DAP-' || to_char(seq."createdAt", 'YYYY') || '-' || lpad(nextval('"Order_number_seq"')::text, 4, '0'),
  "receiptToken" = replace(gen_random_uuid()::text, '-', '')
FROM (
  SELECT "id", "createdAt"
  FROM "Order"
  WHERE "orderNumber" IS NULL
  ORDER BY "createdAt" ASC
) AS seq
WHERE o."id" = seq."id";

-- Judul produk untuk baris lama diambil dari terjemahan yang ada — bahasa
-- Inggris lebih dulu, lalu bahasa apa pun yang tersedia. Order yang produknya
-- sudah dihapus tetap kosong; halaman tanda terima menanganinya.
UPDATE "Order" AS o
SET "productTitle" = COALESCE(
  (
    SELECT t."title"
    FROM "DigitalProductTranslation" t
    WHERE t."productId" = o."productId"
    ORDER BY (t."locale" = 'en') DESC, t."locale" ASC
    LIMIT 1
  ),
  ''
)
WHERE o."productId" IS NOT NULL;

ALTER TABLE "Order"
  ALTER COLUMN "orderNumber" SET NOT NULL,
  ALTER COLUMN "receiptToken" SET NOT NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_receiptToken_key" ON "Order"("receiptToken");
