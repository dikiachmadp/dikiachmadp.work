-- About page: profil satu baris (portrait + bio per bahasa) plus entri
-- pengalaman/sertifikasi berbaris per bahasa, dipindah dari
-- src/content/{en,id}/about.json ke database supaya bisa di-CRUD lewat admin.
--
-- Ditulis tangan dari `npx prisma migrate diff --from-config-datasource
-- --to-schema prisma/schema.prisma --script`, diff-nya bersih (tidak ada
-- DROP TABLE yang harus dibuang).

-- CreateEnum
CREATE TYPE "AboutEntryKind" AS ENUM ('EXPERIENCE', 'CERTIFICATION');

-- CreateTable
CREATE TABLE "AboutProfile" (
    "id" TEXT NOT NULL,
    "portraitUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutProfileTranslation" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "biography" TEXT[],
    "sticker" TEXT NOT NULL,
    "experienceTitle" TEXT NOT NULL,
    "skillsTitle" TEXT NOT NULL,
    "certificationsTitle" TEXT NOT NULL,
    "cvNote" TEXT NOT NULL,
    "skills" JSONB NOT NULL,
    "cvItems" JSONB NOT NULL,

    CONSTRAINT "AboutProfileTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutEntry" (
    "id" TEXT NOT NULL,
    "kind" "AboutEntryKind" NOT NULL,
    "locale" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "year" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "url" TEXT,

    CONSTRAINT "AboutEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AboutProfileTranslation_profileId_locale_key" ON "AboutProfileTranslation"("profileId", "locale");

-- CreateIndex
CREATE INDEX "AboutEntry_kind_locale_order_idx" ON "AboutEntry"("kind", "locale", "order");

-- AddForeignKey
ALTER TABLE "AboutProfileTranslation" ADD CONSTRAINT "AboutProfileTranslation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AboutProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Row Level Security: Prisma terhubung sebagai role postgres (bypass RLS),
-- kebijakan ini melindungi permukaan Data API (PostgREST) Supabase.
-- About selalu publik dan tidak punya draft, jadi mengikuti pola `0_init`
-- (USING (true)) — bukan pola draft-aware LogbookPost.
ALTER TABLE "AboutProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AboutProfileTranslation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AboutEntry" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON "AboutProfile"
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read" ON "AboutProfileTranslation"
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Public read" ON "AboutEntry"
  FOR SELECT TO anon, authenticated
  USING (true);


-- Seed: isi src/content/{en,id}/about.json saat ini, supaya halaman /about
-- tidak pernah kosong di antara deploy migrasi ini dan pengisian pertama
-- lewat admin. Dua entri CV di bawah sama-sama menunjuk /CV_Diki.pdf
-- meski berlabel Bahasa Indonesia dan English — dibawa apa adanya dari
-- JSON lama; sekarang bisa dibetulkan lewat admin.
INSERT INTO "AboutProfile" ("id", "portraitUrl", "updatedAt") VALUES
  ('f2f2ee41-13cd-4e21-9319-5fb95c2197d4', NULL, CURRENT_TIMESTAMP);

INSERT INTO "AboutProfileTranslation"
  ("id", "profileId", "locale", "biography", "sticker", "experienceTitle", "skillsTitle", "certificationsTitle", "cvNote", "skills", "cvItems")
VALUES
  (
    '6ab96f99-2d92-495d-8e86-86deeb6ef12f',
    'f2f2ee41-13cd-4e21-9319-5fb95c2197d4',
    'en',
    ARRAY[
      'Creative, detail-obsessed designer with 6+ years across packaging, UI/UX and 3D. I work with founders, studios and universities — mostly remote, always hands-on.',
      'I''ve shipped work for clients in Australia, Canada and Indonesia, and I care as much about the handoff as the hero shot.'
    ],
    'hi, that''s me 👋',
    'Experience',
    'Skills & tools',
    'Certifications',
    'grab my CV',
    $$[{"category":"Design","items":["Brand Identity","UI/UX","Packaging","3D"]},{"category":"Tools","items":["Adobe CC","Figma","Blender","Next.js"]}]$$::jsonb,
    $$[{"label":"CV — Bahasa Indonesia","href":"/CV_Diki.pdf"},{"label":"CV — English","href":"/CV_Diki.pdf"}]$$::jsonb
  ),
  (
    '9572c9e8-72d2-4c45-8591-fbd51730b636',
    'f2f2ee41-13cd-4e21-9319-5fb95c2197d4',
    'id',
    ARRAY[
      'Desainer yang teliti dengan pengalaman 6+ tahun di kemasan, UI/UX, dan 3D. Bekerja bersama founder, studio, dan kampus — sebagian besar remote, selalu turun tangan.',
      'Sudah mengerjakan proyek untuk klien di Australia, Kanada, dan Indonesia, dan sama pedulinya pada proses handoff maupun visual akhirnya.'
    ],
    'halo, itu saya 👋',
    'Pengalaman',
    'Keahlian & alat',
    'Sertifikasi',
    'unduh CV saya',
    $$[{"category":"Design","items":["Identitas Brand","UI/UX","Kemasan","3D"]},{"category":"Tools","items":["Adobe CC","Figma","Blender","Next.js"]}]$$::jsonb,
    $$[{"label":"CV — Bahasa Indonesia","href":"/CV_Diki.pdf"},{"label":"CV — English","href":"/CV_Diki.pdf"}]$$::jsonb
  );

INSERT INTO "AboutEntry" ("id", "kind", "locale", "order", "year", "title", "subtitle", "url") VALUES
  ('7a67978c-f040-451b-80c9-9e3f62ebedb9', 'EXPERIENCE', 'en', 0, '2016 — now', 'Publishing Staff', 'FEB UNPAS, Bandung', NULL),
  ('704e2125-f5be-4a28-a506-88162527ffd3', 'EXPERIENCE', 'en', 1, '2019 — now', 'Graphic Designer', 'Freelance (remote)', NULL),
  ('86fa8f1a-00ee-466c-8528-07f0362940aa', 'EXPERIENCE', 'en', 2, '2019 — now', '3D Artist', 'Freelance (remote)', NULL),
  ('4412fc2a-90e1-4767-a6be-6f1c7e1a151c', 'EXPERIENCE', 'id', 0, '2016 — kini', 'Staf Penerbitan', 'FEB UNPAS, Bandung', NULL),
  ('566a9f3a-7dcd-43a4-8f41-c09245ac1e04', 'EXPERIENCE', 'id', 1, '2019 — kini', 'Desainer Grafis', 'Lepas (remote)', NULL),
  ('1f963c11-8f16-466f-bc2d-ab91cf3f99ce', 'EXPERIENCE', 'id', 2, '2019 — kini', 'Seniman 3D', 'Lepas (remote)', NULL);
