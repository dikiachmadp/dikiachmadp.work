import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    digitalProduct: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    digitalProductTranslation: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createProductWithTranslations,
  getProductBySlug,
  getPublishedProducts,
  updateProductWithTranslations,
  type DigitalProductInput,
} from "@/lib/db/products";

const publishedAt = new Date("2026-08-01T00:00:00.000Z");
const updatedAt = new Date("2026-08-02T00:00:00.000Z");

function translation(locale: string) {
  return {
    id: `tr-${locale}`,
    productId: "p1",
    locale,
    slug: `slug-${locale}`,
    title: `Title ${locale}`,
    summary: `Summary ${locale}`,
    body: `Body ${locale}`,
  };
}

function product(translations: ReturnType<typeof translation>[]) {
  return {
    id: "p1",
    status: "PUBLISHED" as const,
    publishedAt,
    featured: false,
    order: 0,
    price: { toString: () => "19.99" },
    currency: "USD",
    buyUrl: "https://gumroad.com/l/x",
    coverImage: "/covers/a.webp",
    gallery: [],
    tags: ["OJS"],
    createdAt: publishedAt,
    updatedAt,
    translations,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPublishedProducts", () => {
  it("meratakan translation sesuai locale", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([
      product([translation("id")]),
    ] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(1 as never);

    const { products } = await getPublishedProducts("id");

    expect(products).toHaveLength(1);
    expect(products[0].slug).toBe("slug-id");
    expect(products[0].title).toBe("Title id");
  });

  // Produk yang belum diterjemahkan ke bahasa yang diminta tidak muncul di
  // bahasa itu — tanpa fallback ke "en", sama seperti Logbook.
  it("does not fall back to en when the locale translation is missing", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([
      product([translation("en")]),
    ] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(1 as never);

    const { products } = await getPublishedProducts("id");

    expect(products).toHaveLength(0);
  });

  it("converts the Decimal price to a string", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([
      product([translation("en")]),
    ] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(1 as never);

    const { products } = await getPublishedProducts("en");

    expect(products[0].price).toBe("19.99");
  });

  it("does not carry the body into index summaries", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([
      product([translation("en")]),
    ] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(1 as never);

    const { products } = await getPublishedProducts("en");

    expect(products[0]).not.toHaveProperty("body");
  });

  it("paginates instead of pulling the whole table", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(0 as never);

    await getPublishedProducts("en", { page: 3, perPage: 5 });

    const args = vi.mocked(prisma.digitalProduct.findMany).mock.calls[0][0];
    expect(args?.skip).toBe(10);
    expect(args?.take).toBe(5);
  });

  it("folds a search query into the translations filter", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(0 as never);

    await getPublishedProducts("en", { query: "  minimalist  " });

    const where = vi.mocked(prisma.digitalProduct.findMany).mock.calls[0][0]
      ?.where;
    expect(where?.translations).toEqual({
      some: {
        locale: "en",
        OR: [
          { title: { contains: "minimalist", mode: "insensitive" } },
          { summary: { contains: "minimalist", mode: "insensitive" } },
        ],
      },
    });
  });

  it("filters by tag when one is given", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(0 as never);

    await getPublishedProducts("en", { tag: "OJS" });

    const where = vi.mocked(prisma.digitalProduct.findMany).mock.calls[0][0]
      ?.where;
    expect(where?.tags).toEqual({ has: "OJS" });
  });
});

describe("query publik menyaring draf dan produk berjadwal", () => {
  it("asks only for published products whose publish time has passed", async () => {
    vi.mocked(prisma.digitalProduct.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.digitalProduct.count).mockResolvedValue(0 as never);

    const before = new Date();
    await getPublishedProducts("en");
    const after = new Date();

    const where = vi.mocked(prisma.digitalProduct.findMany).mock.calls[0][0]
      ?.where;
    expect(where?.status).toBe("PUBLISHED");

    const publishedFilter = where?.publishedAt as { not: null; lte: Date };
    expect(publishedFilter.not).toBeNull();
    expect(publishedFilter.lte.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(publishedFilter.lte.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("applies the same filter when looking a product up by slug", async () => {
    vi.mocked(prisma.digitalProduct.findFirst).mockResolvedValue(null as never);

    await getProductBySlug("id", "apa-pun");

    const where = vi.mocked(prisma.digitalProduct.findFirst).mock.calls[0][0]
      ?.where;
    expect(where?.status).toBe("PUBLISHED");
    expect(where?.translations).toEqual({
      some: { locale: "id", slug: "apa-pun" },
    });
  });
});

// --- Fungsi tulis ---

type Call = { model: string; method: string; args: unknown };

function fakeTx(existing: Record<string, unknown>[] = []) {
  const calls: Call[] = [];
  const record = (model: string, method: string) => (args: unknown) => {
    calls.push({ model, method, args });
    if (model === "digitalProductTranslation" && method === "findMany") {
      return Promise.resolve(existing);
    }
    if (method === "upsert") {
      const locale = (
        args as { where: { productId_locale: { locale: string } } }
      ).where.productId_locale.locale;
      return Promise.resolve({ id: `tr-${locale}` });
    }
    return Promise.resolve({ id: "p1" });
  };

  const tx = {
    digitalProduct: {
      create: record("digitalProduct", "create"),
      update: record("digitalProduct", "update"),
      delete: record("digitalProduct", "delete"),
    },
    digitalProductTranslation: {
      findMany: record("digitalProductTranslation", "findMany"),
      upsert: record("digitalProductTranslation", "upsert"),
      deleteMany: record("digitalProductTranslation", "deleteMany"),
    },
  };

  vi.mocked(prisma.$transaction).mockImplementation(((
    run: (tx: unknown) => unknown,
  ) => run(tx)) as never);
  return calls;
}

function input(
  overrides: Partial<DigitalProductInput> = {},
): DigitalProductInput {
  return {
    status: "PUBLISHED",
    publishedAt,
    featured: false,
    order: 0,
    price: "19.99",
    currency: "USD",
    buyUrl: "https://gumroad.com/l/x",
    coverImage: "/covers/a.webp",
    gallery: [],
    tags: ["OJS"],
    translations: {
      en: {
        slug: "new-en",
        title: "T",
        summary: "S",
        body: "B",
      },
      id: null,
    },
    ...overrides,
  };
}

describe("createProductWithTranslations", () => {
  it("creates the product, then upserts translations, deleting the empty language", async () => {
    const calls = fakeTx();

    await createProductWithTranslations(input());

    expect(calls.map((c) => `${c.model}.${c.method}`)).toEqual([
      "digitalProduct.create",
      "digitalProductTranslation.upsert",
      "digitalProductTranslation.deleteMany",
    ]);
  });
});

describe("updateProductWithTranslations", () => {
  it("returns the previous slugs for revalidation", async () => {
    fakeTx([
      { locale: "en", slug: "old-en" },
      { locale: "id", slug: "old-id" },
    ]);

    const result = await updateProductWithTranslations("p1", input());

    expect(result.previousSlugs).toEqual([
      { locale: "en", slug: "old-en" },
      { locale: "id", slug: "old-id" },
    ]);
  });
});
