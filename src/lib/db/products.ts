import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/types/content";
import {
  blockImageUrls,
  localizeBlocks,
  productBlocksSchema,
  type LocalizedBlock,
  type ProductBlocks,
} from "@/schemas/product-blocks";
import type {
  DigitalProduct,
  DigitalProductTranslation,
  Prisma,
} from "@/../prisma/generated/prisma/client";

type ProductWithTranslations = DigitalProduct & {
  translations: DigitalProductTranslation[];
};

export type DigitalProductSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  /** String, bukan `Decimal` Prisma — tipe itu tidak boleh bocor ke komponen klien. */
  price: string | null;
  currency: string;
  /** `null` untuk produk yang dijual lewat Polar — tidak ada toko eksternal. */
  buyUrl: string | null;
  tags: string[];
  featured: boolean;
  publishedAt: Date | null;
  /**
   * Jumlahnya saja, bukan isinya: kartu katalog cuma menyebut "3 berkas".
   * Mengirim daftarnya utuh ke halaman daftar tidak ada gunanya.
   */
  deliverablesCount: number;
};

export type DigitalProductDetail = DigitalProductSummary & {
  body: string;
  gallery: string[];
  /** Blok halaman jualan, sudah diratakan ke satu bahasa, urutan apa adanya. */
  blocks: LocalizedBlock[];
  /** "Apa yang kamu dapat" di bahasa ini. */
  deliverables: string[];
  /** Kosong -> tombol demo tidak dirender sama sekali. */
  demoUrl: string | null;
  updatedAt: Date;
  /**
   * Hanya di detail, bukan di summary: kartu indeks tidak membuka checkout,
   * jadi tidak ada gunanya mengirim ID ini ke halaman daftar.
   */
  polarProductId: string | null;
  pwywEnabled: boolean;
  /** Sen. */
  pwywMinAmount: number;
};

/**
 * Kolom `blocks` bertipe `Json`, jadi Prisma menyerahkannya sebagai nilai
 * bebas — bentuknya diperiksa saat **baca**, bukan hanya saat tulis. Baris
 * yang bentuknya tidak dikenali menghasilkan nol blok plus catatan di log:
 * halaman produk tidak boleh mati gara-gara satu blok cacat.
 */
function readBlocks(
  value: unknown,
  locale: Locale,
  productId: string,
): LocalizedBlock[] {
  const parsed = productBlocksSchema.safeParse(value ?? []);
  if (!parsed.success) {
    console.error(
      `Blok produk ${productId} tidak valid; seluruhnya dilewati.`,
      parsed.error.issues,
    );
    return [];
  }
  return localizeBlocks(parsed.data, locale);
}

/**
 * Meratakan produk + terjemahan untuk satu locale. **Tanpa fallback ke
 * "en"**: produk yang belum diterjemahkan ke bahasa ini tidak muncul di
 * bahasa ini — sama seperti Logbook, berbeda dari Project.
 */
function flatten(
  row: ProductWithTranslations,
  locale: Locale,
): DigitalProductDetail | null {
  const tr = row.translations.find((t) => t.locale === locale);
  if (!tr) return null;

  return {
    id: row.id,
    slug: tr.slug,
    title: tr.title,
    summary: tr.summary,
    body: tr.body,
    coverImage: row.coverImage,
    gallery: row.gallery,
    blocks: readBlocks(row.blocks, locale, row.id),
    deliverables: tr.deliverables,
    deliverablesCount: tr.deliverables.length,
    demoUrl: row.demoUrl,
    price: row.price ? row.price.toString() : null,
    currency: row.currency,
    buyUrl: row.buyUrl,
    polarProductId: row.polarProductId,
    pwywEnabled: row.pwywEnabled,
    pwywMinAmount: row.pwywMinAmount,
    tags: row.tags,
    featured: row.featured,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  };
}

/** Kartu indeks tidak memakai badan tulisan; jangan ikut dikirim ke klien. */
function toSummary(product: DigitalProductDetail): DigitalProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    summary: product.summary,
    coverImage: product.coverImage,
    price: product.price,
    currency: product.currency,
    buyUrl: product.buyUrl,
    tags: product.tags,
    featured: product.featured,
    publishedAt: product.publishedAt,
    deliverablesCount: product.deliverablesCount,
  };
}

/**
 * Hanya produk yang benar-benar tayang. `publishedAt <= now()` membuat produk
 * berjadwal tetap tersembunyi sampai waktunya — sama seperti Logbook.
 */
function publishedWhere(): Prisma.DigitalProductWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { not: null, lte: new Date() },
  };
}

export async function getPublishedProducts(
  locale: Locale,
  {
    page = 1,
    perPage = 10,
    query,
    tag,
  }: { page?: number; perPage?: number; query?: string; tag?: string } = {},
): Promise<{ products: DigitalProductSummary[]; total: number }> {
  const q = query?.trim();
  const where: Prisma.DigitalProductWhereInput = {
    ...publishedWhere(),
    ...(tag ? { tags: { has: tag } } : {}),
    translations: {
      some: {
        locale,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { summary: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
  };

  const [rows, total] = await Promise.all([
    prisma.digitalProduct.findMany({
      where,
      include: { translations: { where: { locale } } },
      // `order` mengurutkan katalog secara kuratif; `publishedAt` jadi
      // penentu kedua untuk produk dengan `order` yang sama.
      orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.digitalProduct.count({ where }),
  ]);

  const products = rows
    .map((row) => flatten(row, locale))
    .filter((p): p is DigitalProductDetail => p !== null)
    .map(toSummary);

  return { products, total };
}

export async function getProductBySlug(
  locale: Locale,
  slug: string,
): Promise<DigitalProductDetail | null> {
  const row = await prisma.digitalProduct.findFirst({
    where: {
      ...publishedWhere(),
      translations: { some: { locale, slug } },
    },
    include: { translations: { where: { locale } } },
  });
  return row ? flatten(row, locale) : null;
}

/**
 * Untuk sitemap dan `generateStaticParams`. Slug berbeda per bahasa, jadi
 * locale-nya ikut — sama seperti Logbook.
 */
export async function getAllProductSlugs(): Promise<
  { locale: string; slug: string; updatedAt: Date }[]
> {
  const rows = await prisma.digitalProductTranslation.findMany({
    where: { product: publishedWhere() },
    select: {
      locale: true,
      slug: true,
      product: { select: { updatedAt: true } },
    },
  });
  return rows.map((row) => ({
    locale: row.locale,
    slug: row.slug,
    updatedAt: row.product.updatedAt,
  }));
}

// --- Fungsi admin ---

export type DigitalProductTranslationInput = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  deliverables: string[];
};

export type DigitalProductInput = {
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  featured: boolean;
  order: number;
  price: string | null;
  currency: string;
  buyUrl: string | null;
  polarProductId: string | null;
  pwywEnabled: boolean;
  pwywMinAmount: number;
  coverImage: string;
  gallery: string[];
  tags: string[];
  demoUrl: string | null;
  blocks: ProductBlocks;
  /** Terjemahan opsional per produk: `null` berarti produk tidak ada di bahasa itu. */
  translations: Record<Locale, DigitalProductTranslationInput | null>;
};

const translationLocales = ["en", "id"] as const;

export async function getProductsPage({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const [rows, total] = await Promise.all([
    prisma.digitalProduct.findMany({
      include: {
        translations: { select: { locale: true, slug: true, title: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.digitalProduct.count(),
  ]);
  return { rows, total };
}

export async function getProductForEdit(id: string) {
  return prisma.digitalProduct.findUnique({
    where: { id },
    include: { translations: true },
  });
}

function productData(input: DigitalProductInput) {
  return {
    status: input.status,
    publishedAt: input.publishedAt,
    featured: input.featured,
    order: input.order,
    price: input.price,
    currency: input.currency,
    buyUrl: input.buyUrl,
    polarProductId: input.polarProductId,
    pwywEnabled: input.pwywEnabled,
    pwywMinAmount: input.pwywMinAmount,
    coverImage: input.coverImage,
    gallery: input.gallery,
    tags: input.tags,
    demoUrl: input.demoUrl,
    // Prisma menerima larik biasa untuk kolom Json; bentuknya sudah dijamin
    // oleh productBlocksSchema di lapisan form.
    blocks: input.blocks,
  };
}

type Tx = Prisma.TransactionClient;

/**
 * Terjemahan ditulis ulang seluruhnya lewat upsert per bahasa — pola yang
 * sama dengan `writeTranslations` di logbook.ts.
 */
async function writeTranslations(
  tx: Tx,
  productId: string,
  input: DigitalProductInput,
) {
  for (const locale of translationLocales) {
    const translation = input.translations[locale];

    if (!translation) {
      await tx.digitalProductTranslation.deleteMany({
        where: { productId, locale },
      });
      continue;
    }

    await tx.digitalProductTranslation.upsert({
      where: { productId_locale: { productId, locale } },
      create: { productId, locale, ...translation },
      update: translation,
    });
  }
}

export async function createProductWithTranslations(
  input: DigitalProductInput,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.digitalProduct.create({
      data: productData(input),
    });
    await writeTranslations(tx, product.id, input);
    return product;
  });
}

/**
 * Mengembalikan slug lama per bahasa supaya pemanggilnya bisa merevalidasi
 * URL lama — pola yang sama dengan `updatePostWithTranslations`.
 */
export async function updateProductWithTranslations(
  id: string,
  input: DigitalProductInput,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.digitalProductTranslation.findMany({
      where: { productId: id },
      select: { locale: true, slug: true },
    });

    const product = await tx.digitalProduct.update({
      where: { id },
      data: productData(input),
    });
    await writeTranslations(tx, id, input);

    return {
      product,
      previousSlugs: before.map((tr) => ({ locale: tr.locale, slug: tr.slug })),
    };
  });
}

/** Mengembalikan slug dan URL gambar milik produk supaya bisa dibersihkan. */
export async function deleteProductById(id: string) {
  return prisma.$transaction(async (tx) => {
    const [product, translations] = await Promise.all([
      tx.digitalProduct.findUnique({
        where: { id },
        select: { coverImage: true, gallery: true, blocks: true },
      }),
      tx.digitalProductTranslation.findMany({
        where: { productId: id },
        select: { locale: true, slug: true },
      }),
    ]);
    await tx.digitalProduct.delete({ where: { id } });

    // Gambar di dalam blok ikut dikumpulkan, bukan hanya cover dan galeri —
    // tanpa ini menghapus produk meninggalkan berkas yatim di bucket.
    const parsedBlocks = productBlocksSchema.safeParse(product?.blocks ?? []);
    const imageUrls = [
      ...(product?.coverImage ? [product.coverImage] : []),
      ...(product?.gallery ?? []),
      ...(parsedBlocks.success ? blockImageUrls(parsedBlocks.data) : []),
    ];

    return {
      slugs: translations.map((tr) => ({ locale: tr.locale, slug: tr.slug })),
      imageUrls,
    };
  });
}
