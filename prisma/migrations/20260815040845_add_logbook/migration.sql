-- Logbook: pos berslug dengan terjemahan opsional per bahasa dan galeri gambar.
--
-- Ditulis tangan dari `prisma migrate diff --from-config-datasource
-- --to-schema prisma/schema.prisma --script`, dengan seluruh pernyataan
-- `DROP TABLE` dibuang. Diff itu juga mengusulkan menghapus tabel snake_case
-- warisan yang masih ada di basis data (contact_messages, experiments,
-- logbook_posts, products, profile, projects, services, site_settings,
-- social_links, testimonials) semata karena tidak ada di schema.prisma.
-- Tabel-tabel itu di luar lingkup migrasi ini; membuangnya adalah keputusan
-- tersendiri, bukan efek samping penambahan fitur.

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "LogbookPost" (
    "id" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogbookPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogbookPostTranslation" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "LogbookPostTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogbookImage" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LogbookImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogbookPost_status_publishedAt_idx" ON "LogbookPost"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "LogbookPostTranslation_locale_postId_idx" ON "LogbookPostTranslation"("locale", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "LogbookPostTranslation_postId_locale_key" ON "LogbookPostTranslation"("postId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "LogbookPostTranslation_locale_slug_key" ON "LogbookPostTranslation"("locale", "slug");

-- CreateIndex
CREATE INDEX "LogbookImage_translationId_order_idx" ON "LogbookImage"("translationId", "order");

-- AddForeignKey
ALTER TABLE "LogbookPostTranslation" ADD CONSTRAINT "LogbookPostTranslation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "LogbookPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookImage" ADD CONSTRAINT "LogbookImage_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "LogbookPostTranslation"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Row Level Security: Prisma terhubung sebagai role postgres (bypass RLS),
-- kebijakan ini melindungi permukaan Data API (PostgREST) Supabase.
-- Mengikuti pola 0_init: tanpa ENABLE, ketiga tabel terbuka lewat Data API.
ALTER TABLE "LogbookPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LogbookPostTranslation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LogbookImage" ENABLE ROW LEVEL SECURITY;

-- Konten publik, tetapi hanya yang sudah terbit. Berbeda dari Project, Logbook
-- punya draf — dan anon key Supabase ada di bundel klien, jadi `USING (true)`
-- akan membuat badan tulisan yang belum terbit bisa diambil siapa saja lewat
-- PostgREST. Penyaringan di query aplikasi tidak menutup jalur itu.
CREATE POLICY "Public read published" ON "LogbookPost"
  FOR SELECT TO anon, authenticated
  USING ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL AND "publishedAt" <= now());

CREATE POLICY "Public read published" ON "LogbookPostTranslation"
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM "LogbookPost" p
    WHERE p."id" = "LogbookPostTranslation"."postId"
      AND p."status" = 'PUBLISHED'
      AND p."publishedAt" IS NOT NULL
      AND p."publishedAt" <= now()
  ));

CREATE POLICY "Public read published" ON "LogbookImage"
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM "LogbookPostTranslation" t
    JOIN "LogbookPost" p ON p."id" = t."postId"
    WHERE t."id" = "LogbookImage"."translationId"
      AND p."status" = 'PUBLISHED'
      AND p."publishedAt" IS NOT NULL
      AND p."publishedAt" <= now()
  ));
