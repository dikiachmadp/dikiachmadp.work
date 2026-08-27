import "server-only";
import { prisma } from "@/lib/prisma";

export type RecordOrderInput = {
  polarOrderId: string;
  polarCheckoutId: string | null;
  productId: string | null;
  email: string;
  /** Sen. */
  amount: number;
  currency: string;
};

/**
 * Mencatat satu checkout yang selesai dibayar.
 *
 * `upsert` pada `polarOrderId`, bukan `create`: Polar menjamin pengiriman
 * webhook *setidaknya* sekali, jadi event yang sama wajar datang dua kali —
 * entah karena percobaan ulang atau karena kita sempat menjawab lambat.
 * `create` akan melempar unique violation di percobaan kedua dan membuat Polar
 * mengulang lagi selamanya. `update` sengaja menulis ulang nilainya alih-alih
 * jadi no-op, supaya koreksi dari Polar tetap masuk.
 */
export async function recordOrder(input: RecordOrderInput) {
  const { polarOrderId, ...rest } = input;
  return prisma.order.upsert({
    where: { polarOrderId },
    create: { polarOrderId, ...rest },
    update: rest,
  });
}

/** Untuk daftar di dasbor admin. Bentuknya mengikuti `getProductsPage()`. */
export async function getOrdersPage({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      include: {
        product: {
          select: {
            translations: { select: { locale: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count(),
  ]);
  return { rows, total };
}
