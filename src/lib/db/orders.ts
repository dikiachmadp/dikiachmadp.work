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
  /** Bahasa yang dipilih pembeli saat checkout; menentukan bahasa dokumennya. */
  locale: string;
};

/**
 * Judul produk saat transaksi terjadi.
 *
 * Dicari di sini, bukan diambil lewat relasi saat tanda terima dibaca: judul
 * produk bisa berubah, dan dokumen transaksi harus menyatakan apa yang berlaku
 * ketika uangnya berpindah. Terjemahan bahasa pembeli lebih dulu, lalu bahasa
 * apa pun yang ada — lebih baik judul dalam bahasa yang keliru daripada tanda
 * terima tanpa nama barang.
 */
async function resolveProductTitle(
  productId: string | null,
  locale: string,
): Promise<string> {
  if (!productId) return "";
  const translations = await prisma.digitalProductTranslation.findMany({
    where: { productId },
    select: { locale: true, title: true },
  });
  const preferred = translations.find((t) => t.locale === locale);
  return (preferred ?? translations[0])?.title ?? "";
}

/**
 * Mencatat satu checkout yang selesai dibayar.
 *
 * `upsert` pada `polarOrderId`, bukan `create`: Polar menjamin pengiriman
 * webhook *setidaknya* sekali, jadi event yang sama wajar datang dua kali —
 * entah karena percobaan ulang atau karena kita sempat menjawab lambat.
 * `create` akan melempar unique violation di percobaan kedua dan membuat Polar
 * mengulang lagi selamanya.
 *
 * Kolomnya terbagi dua dengan sengaja. `mutable` ditulis ulang di kedua cabang
 * supaya koreksi dari Polar tetap masuk. `snapshot` hanya ditulis saat baris
 * dibuat: judul produk dan bahasa dokumen adalah potret keadaan saat transaksi,
 * dan webhook yang diulang seminggu kemudian tidak boleh menulis ulang tanda
 * terima yang sudah terlanjur dikirim dengan judul produk yang sejak itu
 * berubah.
 *
 * `orderNumber` dan `receiptToken` tidak muncul di sini sama sekali — DEFAULT
 * di basis data yang mengisinya, jadi keduanya secara struktural mustahil
 * tersentuh oleh cabang update.
 */
export async function recordOrder(input: RecordOrderInput) {
  const { polarOrderId, currency, locale, ...rest } = input;

  /**
   * Polar mengirim kode mata uang dalam huruf kecil (`idr`, `usd`), sedangkan
   * `DigitalProduct.currency` menyimpannya dalam huruf besar. Tanpa
   * penyeragaman ini, mengelompokkan pemasukan per mata uang menghasilkan dua
   * kelompok untuk mata uang yang sama. Dinormalkan saat masuk, bukan saat
   * dibaca, supaya kolomnya hanya pernah berisi satu ejaan.
   */
  const mutable = { ...rest, currency: currency.toUpperCase() };
  const snapshot = {
    locale,
    productTitle: await resolveProductTitle(input.productId, locale),
  };

  return prisma.order.upsert({
    where: { polarOrderId },
    create: { polarOrderId, ...mutable, ...snapshot },
    update: mutable,
  });
}

export type OrderWithProduct = NonNullable<
  Awaited<ReturnType<typeof getOrderByToken>>
>;

/**
 * Satu-satunya jalan masuk ke halaman tanda terima. Token acak inilah
 * pengamannya: tidak ada login, dan pembeli tidak punya akun di sini.
 *
 * Slug produk ikut diambil supaya dokumennya bisa menautkan balik ke halaman
 * produk — tapi hanya kalau produknya memang masih ada. Judul yang dicetak
 * tetap dari cuplikan di baris ini, bukan dari relasi.
 */
export async function getOrderByToken(token: string) {
  return prisma.order.findUnique({
    where: { receiptToken: token },
    include: {
      product: {
        select: {
          translations: { select: { locale: true, slug: true } },
        },
      },
    },
  });
}

/**
 * Menandai tanda terima sudah terkirim.
 *
 * Dipisah dari `recordOrder` supaya pencatatan transaksi tidak pernah
 * bergantung pada berhasilnya email — dua hal yang gagal karena sebab yang
 * sama sekali berbeda.
 */
export async function markReceiptSent(id: string) {
  return prisma.order.update({
    where: { id },
    data: { receiptSentAt: new Date() },
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

/** Untuk tombol "kirim ulang" di dasbor. */
export async function getOrderById(id: string) {
  return prisma.order.findUnique({ where: { id } });
}
