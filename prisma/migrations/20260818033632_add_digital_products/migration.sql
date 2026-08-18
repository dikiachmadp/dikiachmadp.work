-- Digital products: model penuh (harga, galeri, body Markdown per bahasa),
-- setara Project/Logbook — halaman index, halaman detail, dan CRUD admin
-- sendiri, menggantikan dua item `"type": "store"` yang sebelumnya ditulis
-- tangan di src/content/{en,id}/studio.json.
--
-- Ditulis tangan dari `npx prisma migrate diff --from-config-datasource
-- --to-schema prisma/schema.prisma --script`, diff-nya bersih.

-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "buyUrl" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "gallery" TEXT[],
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "DigitalProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalProduct_status_publishedAt_idx" ON "DigitalProduct"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "DigitalProduct_order_idx" ON "DigitalProduct"("order");

-- CreateIndex
CREATE INDEX "DigitalProductTranslation_locale_productId_idx" ON "DigitalProductTranslation"("locale", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProductTranslation_productId_locale_key" ON "DigitalProductTranslation"("productId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProductTranslation_locale_slug_key" ON "DigitalProductTranslation"("locale", "slug");

-- AddForeignKey
ALTER TABLE "DigitalProductTranslation" ADD CONSTRAINT "DigitalProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Row Level Security: Prisma terhubung sebagai role postgres (bypass RLS),
-- kebijakan ini melindungi permukaan Data API (PostgREST) Supabase.
-- Produk punya draf, dan anon key Supabase ada di bundel klien — pola
-- draft-aware yang sama dengan LogbookPost, bukan pola selalu-publik About.
ALTER TABLE "DigitalProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DigitalProductTranslation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published" ON "DigitalProduct"
  FOR SELECT TO anon, authenticated
  USING ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL AND "publishedAt" <= now());

CREATE POLICY "Public read published" ON "DigitalProductTranslation"
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM "DigitalProduct" p
    WHERE p."id" = "DigitalProductTranslation"."productId"
      AND p."status" = 'PUBLISHED'
      AND p."publishedAt" IS NOT NULL
      AND p."publishedAt" <= now()
  ));


-- Seed: dua produk Gumroad yang sebelumnya ditulis tangan di
-- src/content/{en,id}/studio.json (item bertipe "store"). `coverImage`
-- kosong ("") sengaja, bukan NULL — kolomnya NOT NULL mengikuti pola
-- Project.coverImage, dan string kosong berarti "tanpa cover", direnderkan
-- ProductCard sebagai panel crosshatch, persis seperti ProjectCard.
INSERT INTO "DigitalProduct"
  ("id", "status", "publishedAt", "featured", "order", "price", "currency", "buyUrl", "coverImage", "gallery", "tags", "createdAt", "updatedAt")
VALUES
  (
    'a008e8f6-9533-41f8-8346-ba7828b09dcc', 'PUBLISHED', CURRENT_TIMESTAMP, false, 0,
    NULL, 'USD', 'https://kidstudio.gumroad.com/l/minimalist-theme', '',
    ARRAY[]::TEXT[], ARRAY['OJS']::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    '101cc165-2043-4189-b224-f78e50d7912a', 'PUBLISHED', CURRENT_TIMESTAMP, false, 1,
    NULL, 'USD', 'https://kidstudio.gumroad.com/l/modern-theme', '',
    ARRAY[]::TEXT[], ARRAY['OJS']::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

INSERT INTO "DigitalProductTranslation" ("id", "productId", "locale", "slug", "title", "summary", "body") VALUES
  (
    'a215d351-8221-43e6-90a0-0d4116a0d616', 'a008e8f6-9533-41f8-8346-ba7828b09dcc', 'en',
    'ojs-3-css-minimalist', 'OJS 3 CSS — Minimalist',
    'A clean, readable CSS template for academic journals on OJS 3.',
    'A clean, readable CSS template for academic journals running on OJS 3. Drop it into your journal''s theme settings for a minimalist, distraction-free reading experience.'
  ),
  (
    'd743d991-eeee-4d28-aca9-78a6aeb8e92d', 'a008e8f6-9533-41f8-8346-ba7828b09dcc', 'id',
    'ojs-3-css-minimalis', 'OJS 3 CSS — Minimalis',
    'Template CSS bersih dan mudah dibaca untuk jurnal akademik di OJS 3.',
    'Template CSS bersih dan mudah dibaca untuk jurnal akademik yang berjalan di OJS 3. Pasang di pengaturan tema jurnal untuk pengalaman membaca yang minimalis dan bebas gangguan.'
  ),
  (
    '030558ce-188c-408f-8d8e-16cbc70e23f0', '101cc165-2043-4189-b224-f78e50d7912a', 'en',
    'ojs-3-css-modern', 'OJS 3 CSS — Modern',
    'Bold typography and a contemporary look for scholarly publishing.',
    'Bold typography and a contemporary look for scholarly publishing on OJS 3. Built for journals that want their online presence to feel as current as the research they publish.'
  ),
  (
    '98a74151-e63d-49f1-81c6-3649d5f9b922', '101cc165-2043-4189-b224-f78e50d7912a', 'id',
    'ojs-3-css-modern', 'OJS 3 CSS — Modern',
    'Tipografi tegas dan tampilan kontemporer untuk penerbitan ilmiah.',
    'Tipografi tegas dan tampilan kontemporer untuk penerbitan ilmiah di OJS 3. Dibuat untuk jurnal yang ingin tampilan daringnya terasa sesegar riset yang mereka terbitkan.'
  );
