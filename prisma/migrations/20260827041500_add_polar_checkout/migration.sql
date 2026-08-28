-- Checkout on-site lewat Polar: produk bisa dibeli tanpa meninggalkan situs,
-- dengan opsi "bayar sesukanya" (pay what you want) untuk produk gratis.
--
-- `buyUrl` menjadi nullable karena produk yang dijual lewat Polar tidak punya
-- tautan toko eksternal. Produk lama tidak tersentuh: `polarProductId` NULL
-- membuat tombolnya tetap mengarah ke `buyUrl` seperti sebelumnya.
--
-- Ditulis tangan dari `npx prisma migrate diff --from-schema <sebelum>
-- --to-schema prisma/schema.prisma --script`, diff-nya bersih.

-- AlterTable
ALTER TABLE "DigitalProduct" ADD COLUMN     "polarProductId" TEXT,
ADD COLUMN     "pwywEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pwywMinAmount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "buyUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "polarOrderId" TEXT NOT NULL,
    "polarCheckoutId" TEXT,
    "productId" TEXT,
    "email" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_polarOrderId_key" ON "Order"("polarOrderId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Order_productId_idx" ON "Order"("productId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Row Level Security: Prisma terhubung sebagai role postgres (bypass RLS),
-- kebijakan ini melindungi permukaan Data API (PostgREST) Supabase.
--
-- Berbeda dari tabel konten lain, "Order" TIDAK punya policy SELECT sama
-- sekali — tabel ini berisi email pembeli dan nominal yang mereka bayar, dan
-- anon key Supabase ada di bundel browser. RLS aktif tanpa policy berarti
-- tolak-semua lewat Data API; satu-satunya jalan masuk adalah Prisma. Pola yang
-- sama dipakai ContactSubmission.
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
