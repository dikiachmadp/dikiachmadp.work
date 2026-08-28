-- Seksi halaman jualan produk digital. Satu kolom jsonb, bukan tabel sendiri:
-- isinya tidak pernah di-query, hanya dibaca utuh bersama produknya.
-- Kontrak bentuknya ada di src/schemas/product-landing.ts.
ALTER TABLE "DigitalProduct" ADD COLUMN "landing" JSONB NOT NULL DEFAULT '{}';
