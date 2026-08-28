-- Direkonstruksi dari database pada 2026-08-28. Migrasi ini sudah diterapkan
-- ke database pada 2026-08-27 tetapi berkasnya tidak pernah tersimpan di repo;
-- isinya disusun ulang persis dari DDL tabel yang berjalan agar riwayat
-- migrasi lokal kembali cocok dengan database.

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
