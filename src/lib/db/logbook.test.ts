import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    logbookPost: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    logbookPostTranslation: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createPostWithTranslations,
  getAdjacentPosts,
  getPostBySlug,
  getPublishedPosts,
  updatePostWithTranslations,
  type LogbookPostInput,
} from "@/lib/db/logbook";

const publishedAt = new Date("2026-08-01T00:00:00.000Z");
const updatedAt = new Date("2026-08-02T00:00:00.000Z");

function image(order: number, url: string) {
  return {
    id: `img-${order}`,
    translationId: "tr-en",
    url,
    alt: `alt ${order}`,
    caption: null,
    order,
  };
}

function translation(locale: string, images = [image(0, "/a.webp")]) {
  return {
    id: `tr-${locale}`,
    postId: "p1",
    locale,
    slug: `slug-${locale}`,
    title: `Title ${locale}`,
    excerpt: `Excerpt ${locale}`,
    body: `Body ${locale}`,
    images,
  };
}

function post(translations: ReturnType<typeof translation>[]) {
  return {
    id: "p1",
    status: "PUBLISHED" as const,
    publishedAt,
    createdAt: publishedAt,
    updatedAt,
    translations,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Ini pembeda utama Logbook dari Project. `flatten()` di projects.ts jatuh ke
 * terjemahan "en" saat locale yang diminta tidak ada — pilihan yang benar untuk
 * portofolio, tapi salah di sini: pos berbahasa Inggris tidak boleh muncul di
 * tengah situs berbahasa Indonesia hanya karena terjemahannya belum ada.
 *
 * Kalau test ini gagal karena pos itu tetap dikembalikan, yang salah adalah
 * desainnya, bukan test-nya.
 */
describe("getPublishedPosts — terjemahan tanpa fallback", () => {
  it("drops a post that has no translation for the requested locale", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([
      post([translation("en")]),
    ] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(1 as never);

    const { posts } = await getPublishedPosts("id");

    expect(posts).toEqual([]);
  });

  it("returns the post in the locale it does have", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([
      post([translation("en"), translation("id")]),
    ] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(1 as never);

    const { posts } = await getPublishedPosts("id");

    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("slug-id");
    expect(posts[0].title).toBe("Title id");
  });

  // Cover adalah gambar galeri pertama; tidak ada kolom terpisah yang bisa
  // menyimpang dari galerinya.
  it("uses the lowest-ordered gallery image as the cover", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([
      post([
        translation("en", [image(2, "/last.webp"), image(0, "/first.webp")]),
      ]),
    ] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(1 as never);

    const { posts } = await getPublishedPosts("en");

    expect(posts[0].cover?.url).toBe("/first.webp");
  });

  it("leaves the cover null when the post has no images", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([
      post([translation("en", [])]),
    ] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(1 as never);

    const { posts } = await getPublishedPosts("en");

    expect(posts[0].cover).toBeNull();
  });

  // Kartu indeks tidak memakai badan tulisan. Kalau ikut terbawa, seluruh isi
  // tiap pos di halaman itu dikirim ke klien tanpa ada yang menampilkannya.
  it("does not carry the body into index summaries", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([
      post([translation("en")]),
    ] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(1 as never);

    const { posts } = await getPublishedPosts("en");

    expect(posts[0]).not.toHaveProperty("body");
  });
});

/**
 * Draf dan pos berjadwal disaring di query, bukan setelahnya. Test-nya
 * memeriksa `where` yang dikirim ke Prisma: dengan client yang di-mock,
 * itulah satu-satunya tempat aturannya benar-benar hidup.
 */
describe("query publik menyaring draf dan pos berjadwal", () => {
  it("asks only for published posts whose publish time has passed", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(0 as never);

    const before = new Date();
    await getPublishedPosts("en");
    const after = new Date();

    const where = vi.mocked(prisma.logbookPost.findMany).mock.calls[0][0]
      ?.where;
    expect(where?.status).toBe("PUBLISHED");

    const publishedFilter = where?.publishedAt as { not: null; lte: Date };
    expect(publishedFilter.not).toBeNull();
    expect(publishedFilter.lte.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(publishedFilter.lte.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("applies the same filter when looking a post up by slug", async () => {
    vi.mocked(prisma.logbookPost.findFirst).mockResolvedValue(null as never);

    await getPostBySlug("id", "apa-pun");

    const where = vi.mocked(prisma.logbookPost.findFirst).mock.calls[0][0]
      ?.where;
    expect(where?.status).toBe("PUBLISHED");
    expect(where?.translations).toEqual({
      some: { locale: "id", slug: "apa-pun" },
    });
  });

  it("paginates instead of pulling the whole table", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(0 as never);

    await getPublishedPosts("en", { page: 3, perPage: 5 });

    const args = vi.mocked(prisma.logbookPost.findMany).mock.calls[0][0];
    expect(args?.skip).toBe(10);
    expect(args?.take).toBe(5);
  });

  it("folds a search query into the translations filter", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(0 as never);

    await getPublishedPosts("en", { query: "  design  " });

    const where = vi.mocked(prisma.logbookPost.findMany).mock.calls[0][0]
      ?.where;
    expect(where?.translations).toEqual({
      some: {
        locale: "en",
        OR: [
          { title: { contains: "design", mode: "insensitive" } },
          { excerpt: { contains: "design", mode: "insensitive" } },
        ],
      },
    });
  });

  it("leaves the translations filter untouched when the query is empty", async () => {
    vi.mocked(prisma.logbookPost.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.logbookPost.count).mockResolvedValue(0 as never);

    await getPublishedPosts("en", { query: "   " });

    const where = vi.mocked(prisma.logbookPost.findMany).mock.calls[0][0]
      ?.where;
    expect(where?.translations).toEqual({ some: { locale: "en" } });
  });
});

describe("getAdjacentPosts", () => {
  it("returns the older post as prev and the newer post as next", async () => {
    const older = post([translation("en")]);
    older.id = "older";
    older.translations[0].slug = "older-slug";
    older.translations[0].title = "Older Title";

    const newer = post([translation("en")]);
    newer.id = "newer";
    newer.translations[0].slug = "newer-slug";
    newer.translations[0].title = "Newer Title";

    vi.mocked(prisma.logbookPost.findFirst)
      .mockResolvedValueOnce(older as never)
      .mockResolvedValueOnce(newer as never);

    const result = await getAdjacentPosts("en", publishedAt);

    expect(result.prev).toEqual({ slug: "older-slug", title: "Older Title" });
    expect(result.next).toEqual({ slug: "newer-slug", title: "Newer Title" });
  });

  it("returns null at either edge of the timeline", async () => {
    vi.mocked(prisma.logbookPost.findFirst).mockResolvedValue(null as never);

    const result = await getAdjacentPosts("en", publishedAt);

    expect(result).toEqual({ prev: null, next: null });
  });

  it("keeps the publication gate on both neighbour queries", async () => {
    vi.mocked(prisma.logbookPost.findFirst).mockResolvedValue(null as never);

    await getAdjacentPosts("en", publishedAt);

    const calls = vi.mocked(prisma.logbookPost.findFirst).mock.calls;
    for (const [args] of calls) {
      const clauses = args?.where?.AND as Array<Record<string, unknown>>;
      expect(clauses.some((c) => c.status === "PUBLISHED")).toBe(true);
    }
  });
});

// --- Fungsi tulis ---

type Call = { model: string; method: string; args: unknown };

/**
 * `tx` palsu yang mencatat urutan panggilan. Transaksi + upsert adalah bagian
 * paling berisiko dari jalur tulis dan justru yang nol test di sisi Project.
 */
function fakeTx(existing: Record<string, unknown>[] = []) {
  const calls: Call[] = [];
  const record = (model: string, method: string) => (args: unknown) => {
    calls.push({ model, method, args });
    if (model === "logbookPostTranslation" && method === "findMany") {
      return Promise.resolve(existing);
    }
    if (method === "upsert") {
      const locale = (args as { where: { postId_locale: { locale: string } } })
        .where.postId_locale.locale;
      return Promise.resolve({ id: `tr-${locale}` });
    }
    return Promise.resolve({ id: "p1" });
  };

  const tx = {
    logbookPost: {
      create: record("logbookPost", "create"),
      update: record("logbookPost", "update"),
      delete: record("logbookPost", "delete"),
    },
    logbookPostTranslation: {
      findMany: record("logbookPostTranslation", "findMany"),
      upsert: record("logbookPostTranslation", "upsert"),
      deleteMany: record("logbookPostTranslation", "deleteMany"),
    },
    logbookImage: {
      deleteMany: record("logbookImage", "deleteMany"),
      createMany: record("logbookImage", "createMany"),
    },
  };

  vi.mocked(prisma.$transaction).mockImplementation(((
    run: (tx: unknown) => unknown,
  ) => run(tx)) as never);
  return calls;
}

function input(overrides: Partial<LogbookPostInput> = {}): LogbookPostInput {
  return {
    status: "PUBLISHED",
    publishedAt,
    translations: {
      en: {
        slug: "new-en",
        title: "T",
        excerpt: "E",
        body: "B",
        images: [{ url: "/keep.webp", alt: "keep" }],
      },
      id: null,
    },
    ...overrides,
  };
}

describe("createPostWithTranslations", () => {
  it("creates the post, then upserts translations and their images", async () => {
    const calls = fakeTx();

    await createPostWithTranslations(input());

    expect(calls.map((c) => `${c.model}.${c.method}`)).toEqual([
      "logbookPost.create",
      "logbookPostTranslation.upsert",
      "logbookImage.deleteMany",
      "logbookImage.createMany",
      // Blok bahasa yang dikosongkan tetap dihapus, bukan dilewati diam-diam.
      "logbookPostTranslation.deleteMany",
    ]);
  });

  // Urutan galeri adalah urutan array, bukan angka yang dikirim klien.
  it("numbers gallery images by their position", async () => {
    const calls = fakeTx();

    await createPostWithTranslations(
      input({
        translations: {
          en: {
            slug: "s",
            title: "T",
            excerpt: "E",
            body: "B",
            images: [
              { url: "/a.webp", alt: "a" },
              { url: "/b.webp", alt: "b", caption: "kedua" },
            ],
          },
          id: null,
        },
      }),
    );

    const created = calls.find((c) => c.method === "createMany")?.args as {
      data: { url: string; order: number; caption: string | null }[];
    };
    expect(created.data).toEqual([
      {
        translationId: "tr-en",
        url: "/a.webp",
        alt: "a",
        caption: null,
        order: 0,
      },
      {
        translationId: "tr-en",
        url: "/b.webp",
        alt: "b",
        caption: "kedua",
        order: 1,
      },
    ]);
  });
});

describe("updatePostWithTranslations", () => {
  const before = [
    {
      locale: "en",
      slug: "old-en",
      images: [{ url: "/keep.webp" }, { url: "/dropped.webp" }],
    },
    { locale: "id", slug: "old-id", images: [{ url: "/id-only.webp" }] },
  ];

  it("reports the slugs the post had before the edit", async () => {
    fakeTx(before);

    const result = await updatePostWithTranslations("p1", input());

    expect(result.previousSlugs).toEqual([
      { locale: "en", slug: "old-en" },
      { locale: "id", slug: "old-id" },
    ]);
  });

  /**
   * Mengganti cover Project meninggalkan berkas yatim di Storage selamanya.
   * Di sini selisihnya dihitung dan dikembalikan supaya pemanggilnya bisa
   * menghapus berkasnya.
   */
  it("reports images that no longer belong to any translation", async () => {
    fakeTx(before);

    const result = await updatePostWithTranslations("p1", input());

    expect(result.orphanedImageUrls.sort()).toEqual([
      "/dropped.webp",
      "/id-only.webp",
    ]);
  });

  // Gambar yang masih dipakai bahasa lain bukan yatim, walau dilepas dari satu
  // bahasa — kalau ikut dihapus, galeri bahasa lain jadi rusak.
  it("keeps an image that another language still uses", async () => {
    fakeTx([
      { locale: "en", slug: "old-en", images: [{ url: "/shared.webp" }] },
      { locale: "id", slug: "old-id", images: [{ url: "/shared.webp" }] },
    ]);

    const result = await updatePostWithTranslations(
      "p1",
      input({
        translations: {
          en: null,
          id: {
            slug: "s",
            title: "T",
            excerpt: "E",
            body: "B",
            images: [{ url: "/shared.webp", alt: "a" }],
          },
        },
      }),
    );

    expect(result.orphanedImageUrls).toEqual([]);
  });

  it("reads the previous state before writing over it", async () => {
    const calls = fakeTx(before);

    await updatePostWithTranslations("p1", input());

    expect(calls[0]).toMatchObject({
      model: "logbookPostTranslation",
      method: "findMany",
    });
  });
});
