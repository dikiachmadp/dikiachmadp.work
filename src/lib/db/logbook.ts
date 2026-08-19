import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/types/content";
import type {
  LogbookImage,
  LogbookPost,
  LogbookPostTranslation,
  Prisma,
} from "@/../prisma/generated/prisma/client";

type TranslationWithImages = LogbookPostTranslation & {
  images: LogbookImage[];
};

type PostWithTranslations = LogbookPost & {
  translations: TranslationWithImages[];
};

export type LogbookImageItem = {
  id: string;
  url: string;
  alt: string;
  caption?: string;
};

export type LogbookPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | null;
  updatedAt: Date;
  /** Gambar galeri pertama. Tidak ada kolom cover terpisah yang bisa basi. */
  cover: LogbookImageItem | null;
};

export type LogbookPostDetail = LogbookPostSummary & {
  body: string;
  images: LogbookImageItem[];
};

function toImage(row: LogbookImage): LogbookImageItem {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt,
    caption: row.caption ?? undefined,
  };
}

/**
 * Meratakan pos + terjemahan untuk satu locale. **Tanpa fallback ke "en"**:
 * pos yang belum diterjemahkan ke bahasa ini tidak muncul di bahasa ini, bukan
 * tampil berbahasa Inggris di tengah situs berbahasa Indonesia. Ini yang
 * membedakannya dari `flatten()` di projects.ts.
 */
function flatten(
  row: PostWithTranslations,
  locale: Locale,
): LogbookPostDetail | null {
  const tr = row.translations.find((t) => t.locale === locale);
  if (!tr) return null;

  const images = [...tr.images].sort((a, b) => a.order - b.order).map(toImage);

  return {
    id: row.id,
    slug: tr.slug,
    title: tr.title,
    excerpt: tr.excerpt,
    body: tr.body,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    images,
    cover: images[0] ?? null,
  };
}

/** Kartu indeks tidak memakai badan tulisan; jangan ikut dikirim ke klien. */
function toSummary(post: LogbookPostDetail): LogbookPostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    cover: post.cover,
  };
}

/**
 * Hanya pos yang benar-benar tayang. `publishedAt <= now()` membuat pos
 * berjadwal tetap tersembunyi sampai waktunya, bukan hanya bergantung status.
 */
function publishedWhere(): Prisma.LogbookPostWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { not: null, lte: new Date() },
  };
}

const imagesInclude = { orderBy: { order: "asc" } } as const;

export async function getPublishedPosts(
  locale: Locale,
  {
    page = 1,
    perPage = 10,
    query,
  }: { page?: number; perPage?: number; query?: string } = {},
): Promise<{ posts: LogbookPostSummary[]; total: number }> {
  // Query membawa hanya yang dibutuhkan: satu locale, satu halaman. Pencarian
  // difilter di server — bukan ditarik utuh dan disaring di klien seperti
  // ProjectsExplorer — karena halaman ini sudah dipaginasi dan `toSummary()`
  // sengaja membuang `body` dari kartu index; menarik semuanya ke klien
  // membatalkan kedua keputusan itu.
  const q = query?.trim();
  const where: Prisma.LogbookPostWhereInput = {
    ...publishedWhere(),
    translations: {
      some: {
        locale,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { excerpt: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
  };

  const [rows, total] = await Promise.all([
    prisma.logbookPost.findMany({
      where,
      include: {
        translations: { where: { locale }, include: { images: imagesInclude } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.logbookPost.count({ where }),
  ]);

  const posts = rows
    .map((row) => flatten(row, locale))
    .filter((post): post is LogbookPostDetail => post !== null)
    .map(toSummary);

  return { posts, total };
}

export async function getPostBySlug(
  locale: Locale,
  slug: string,
): Promise<LogbookPostDetail | null> {
  const row = await prisma.logbookPost.findFirst({
    where: {
      ...publishedWhere(),
      translations: { some: { locale, slug } },
    },
    include: {
      translations: { where: { locale }, include: { images: imagesInclude } },
    },
  });
  return row ? flatten(row, locale) : null;
}

export type LogbookAdjacentPost = { slug: string; title: string };

/**
 * Tetangga kronologis satu pos, untuk navigasi sebelumnya/berikutnya di
 * halaman detail. "Sebelumnya" = terbit lebih dulu, "berikutnya" = terbit
 * lebih baru — arah yang sama dipakai daftar index (`publishedAt: "desc"`).
 * Dua query kecil dengan `take: 1` masing-masing, bukan menarik seluruh
 * daftar untuk mencari posisi pos ini di dalamnya.
 */
export async function getAdjacentPosts(
  locale: Locale,
  publishedAt: Date,
): Promise<{
  prev: LogbookAdjacentPost | null;
  next: LogbookAdjacentPost | null;
}> {
  // `publishedWhere()` already constrains `publishedAt` (not null, <= now());
  // spreading it and then setting `publishedAt` again would overwrite that
  // constraint instead of narrowing it, so the two conditions are combined
  // with `AND` rather than merged into one object.
  const baseWhere = (cmp: "lt" | "gt"): Prisma.LogbookPostWhereInput => ({
    AND: [
      publishedWhere(),
      { translations: { some: { locale } } },
      { publishedAt: { [cmp]: publishedAt } },
    ],
  });

  const [prevRow, nextRow] = await Promise.all([
    prisma.logbookPost.findFirst({
      where: baseWhere("lt"),
      include: { translations: { where: { locale } } },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.logbookPost.findFirst({
      where: baseWhere("gt"),
      include: { translations: { where: { locale } } },
      orderBy: { publishedAt: "asc" },
    }),
  ]);

  const toAdjacent = (
    row: (LogbookPost & { translations: LogbookPostTranslation[] }) | null,
  ): LogbookAdjacentPost | null => {
    const tr = row?.translations.find((t) => t.locale === locale);
    return tr ? { slug: tr.slug, title: tr.title } : null;
  };

  return { prev: toAdjacent(prevRow), next: toAdjacent(nextRow) };
}

/**
 * 1-indexed chronological rank of this post among published posts in
 * `locale` — the "Log 001" badge. Not a stored field: recomputed from
 * publish order so older posts never need a manual number, at the cost of
 * later numbers shifting if an older post is ever backdated in above it.
 */
export async function getLogNumber(
  locale: Locale,
  publishedAt: Date,
): Promise<number> {
  return prisma.logbookPost.count({
    where: {
      AND: [
        publishedWhere(),
        { translations: { some: { locale } } },
        { publishedAt: { lte: publishedAt } },
      ],
    },
  });
}

/**
 * Untuk sitemap dan `generateStaticParams`. Slug berbeda per bahasa, jadi
 * locale-nya ikut — daftar slug polos tidak cukup di sini.
 */
export async function getAllPostSlugs(): Promise<
  { locale: string; slug: string; updatedAt: Date }[]
> {
  const rows = await prisma.logbookPostTranslation.findMany({
    where: { post: publishedWhere() },
    select: { locale: true, slug: true, post: { select: { updatedAt: true } } },
  });
  return rows.map((row) => ({
    locale: row.locale,
    slug: row.slug,
    updatedAt: row.post.updatedAt,
  }));
}

// --- Fungsi admin ---

export type LogbookImageInput = {
  url: string;
  alt: string;
  caption?: string;
};

export type LogbookTranslationInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  images: LogbookImageInput[];
};

export type LogbookPostInput = {
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  /** Terjemahan opsional per bahasa: `null` berarti pos tidak ada di bahasa itu. */
  translations: Record<Locale, LogbookTranslationInput | null>;
};

const translationLocales = ["en", "id"] as const;

export async function getLogbookPage({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const [rows, total] = await Promise.all([
    prisma.logbookPost.findMany({
      include: {
        translations: { select: { locale: true, slug: true, title: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.logbookPost.count(),
  ]);
  return { rows, total };
}

export async function getPostForEdit(id: string) {
  return prisma.logbookPost.findUnique({
    where: { id },
    include: { translations: { include: { images: imagesInclude } } },
  });
}

function postData(input: LogbookPostInput) {
  return {
    status: input.status,
    publishedAt: input.publishedAt,
  };
}

function imageRows(translationId: string, images: LogbookImageInput[]) {
  return images.map((image, index) => ({
    translationId,
    url: image.url,
    alt: image.alt,
    caption: image.caption ?? null,
    order: index,
  }));
}

type Tx = Prisma.TransactionClient;

/**
 * Galeri selalu ditulis ulang utuh: urutan adalah indeks array, jadi menyimpan
 * selisih per gambar hanya menambah cara untuk salah urut.
 */
async function writeTranslations(
  tx: Tx,
  postId: string,
  input: LogbookPostInput,
) {
  for (const locale of translationLocales) {
    const translation = input.translations[locale];

    if (!translation) {
      // Bahasa yang dikosongkan berarti pos ditarik dari bahasa itu; cascade
      // ikut membuang gambarnya.
      await tx.logbookPostTranslation.deleteMany({ where: { postId, locale } });
      continue;
    }

    const { images, ...fields } = translation;
    const row = await tx.logbookPostTranslation.upsert({
      where: { postId_locale: { postId, locale } },
      create: { postId, locale, ...fields },
      update: fields,
    });

    await tx.logbookImage.deleteMany({ where: { translationId: row.id } });
    if (images.length > 0) {
      await tx.logbookImage.createMany({ data: imageRows(row.id, images) });
    }
  }
}

export async function createPostWithTranslations(input: LogbookPostInput) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.logbookPost.create({ data: postData(input) });
    await writeTranslations(tx, post.id, input);
    return post;
  });
}

/**
 * Mengembalikan slug lama per bahasa dan URL gambar yang tidak lagi terpakai,
 * supaya pemanggilnya bisa merevalidasi URL lama dan menghapus berkas yatim —
 * dua hal yang terlewat di jalur Project.
 */
export async function updatePostWithTranslations(
  id: string,
  input: LogbookPostInput,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.logbookPostTranslation.findMany({
      where: { postId: id },
      select: { locale: true, slug: true, images: { select: { url: true } } },
    });

    const post = await tx.logbookPost.update({
      where: { id },
      data: postData(input),
    });
    await writeTranslations(tx, id, input);

    const keptUrls = new Set(
      translationLocales.flatMap((locale) =>
        (input.translations[locale]?.images ?? []).map((image) => image.url),
      ),
    );
    const orphanedImageUrls = before
      .flatMap((tr) => tr.images.map((image) => image.url))
      .filter((url) => !keptUrls.has(url));

    return {
      post,
      previousSlugs: before.map((tr) => ({ locale: tr.locale, slug: tr.slug })),
      orphanedImageUrls: [...new Set(orphanedImageUrls)],
    };
  });
}

/** Mengembalikan slug dan URL gambar milik pos supaya bisa dibersihkan. */
export async function deletePostById(id: string) {
  return prisma.$transaction(async (tx) => {
    const translations = await tx.logbookPostTranslation.findMany({
      where: { postId: id },
      select: { locale: true, slug: true, images: { select: { url: true } } },
    });
    await tx.logbookPost.delete({ where: { id } });
    return {
      slugs: translations.map((tr) => ({ locale: tr.locale, slug: tr.slug })),
      imageUrls: translations.flatMap((tr) => tr.images.map((i) => i.url)),
    };
  });
}
