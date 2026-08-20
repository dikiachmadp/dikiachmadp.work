import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getAdjacentProjects,
  getProjectBySlug,
  getProjects,
} from "@/lib/db/projects";

const baseRow = {
  id: "p1",
  slug: "website-ekonomi",
  categoryKey: "web-design",
  year: "2026",
  date: "2026-04-15",
  coverImage: "/covers/a.webp",
  logoUrl: null,
  featured: true,
  liveUrl: null,
  isLivePreview: false,
  tags: ["Web Design"],
  tools: ["React"],
  gallery: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [
    {
      id: "tr-en",
      projectId: "p1",
      locale: "en",
      title: "Economics Website",
      client: "FEB UNPAS",
      description: "English description",
      role: "Designer",
      duration: "3 Months",
      contentBlocks: ["en block"],
    },
    {
      id: "tr-id",
      projectId: "p1",
      locale: "id",
      title: "Website Ekonomi",
      client: "FEB UNPAS",
      description: "Deskripsi Indonesia",
      role: "Desainer",
      duration: "3 Bulan",
      contentBlocks: ["blok id"],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProjects", () => {
  it("meratakan translation sesuai locale", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([baseRow] as never);

    const [project] = await getProjects("id");

    expect(project.title).toBe("Website Ekonomi");
    expect(project.description).toBe("Deskripsi Indonesia");
    expect(project.contentBlocks).toEqual(["blok id"]);
    expect(project.slug).toBe("website-ekonomi");
  });

  it("meneruskan take ke findMany", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([baseRow] as never);

    await getProjects("en", { featured: true, take: 3 });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, where: { featured: true } }),
    );
  });

  it("fallback ke translation en bila locale tidak tersedia", async () => {
    const onlyEnglish = {
      ...baseRow,
      translations: [baseRow.translations[0]],
    };
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      onlyEnglish,
    ] as never);

    const [project] = await getProjects("id");

    expect(project.title).toBe("Economics Website");
  });

  it("mengubah field nullable menjadi default aman", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([baseRow] as never);

    const [project] = await getProjects("en");

    expect(project.logoUrl).toBe("");
    expect(project.liveUrl).toBeUndefined();
  });

  it("mengabaikan contentBlocks yang bukan array string", async () => {
    const rowWithBadBlocks = {
      ...baseRow,
      translations: baseRow.translations.map((t) => ({
        ...t,
        contentBlocks: [{ paragraf: "bukan string" }],
      })),
    };
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      rowWithBadBlocks,
    ] as never);

    const [project] = await getProjects("en");

    expect(project.contentBlocks).toBeUndefined();
  });
});

describe("getAdjacentProjects", () => {
  // Terurut terbaru → terlama, meniru `orderBy: { date: "desc" }`.
  const rows = [
    {
      slug: "terbaru",
      translations: [{ locale: "en", title: "Newest" }],
    },
    {
      slug: "tengah-1",
      translations: [{ locale: "en", title: "Middle One" }],
    },
    {
      // Tanggal kembar dengan "tengah-1" di dunia nyata — urutannya di sini
      // yang menentukan tetangga, bukan perbandingan tanggal, jadi kasus ini
      // tetap benar walau `date` sama.
      slug: "tengah-2",
      translations: [{ locale: "en", title: "Middle Two" }],
    },
    {
      slug: "terlama",
      translations: [{ locale: "en", title: "Oldest" }],
    },
  ];

  it("mengembalikan prev (lebih lama) dan next (lebih baru) untuk item tengah", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue(rows as never);

    const { prev, next } = await getAdjacentProjects("en", "tengah-1");

    expect(prev).toEqual({ slug: "tengah-2", title: "Middle Two" });
    expect(next).toEqual({ slug: "terbaru", title: "Newest" });
  });

  it("next null untuk proyek terbaru", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue(rows as never);

    const { prev, next } = await getAdjacentProjects("en", "terbaru");

    expect(next).toBeNull();
    expect(prev).toEqual({ slug: "tengah-1", title: "Middle One" });
  });

  it("prev null untuk proyek terlama", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue(rows as never);

    const { prev, next } = await getAdjacentProjects("en", "terlama");

    expect(prev).toBeNull();
    expect(next).toEqual({ slug: "tengah-2", title: "Middle Two" });
  });

  it("mengembalikan null/null bila slug tidak ditemukan", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue(rows as never);

    const { prev, next } = await getAdjacentProjects("en", "tidak-ada");

    expect(prev).toBeNull();
    expect(next).toBeNull();
  });

  it("fallback ke translation en bila locale tidak tersedia", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue(rows as never);

    const { next } = await getAdjacentProjects("id", "tengah-1");

    expect(next).toEqual({ slug: "terbaru", title: "Newest" });
  });
});

describe("getProjectBySlug", () => {
  it("mengembalikan null bila slug tidak ditemukan", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    expect(await getProjectBySlug("en", "tidak-ada")).toBeNull();
  });

  it("mengembalikan project sesuai locale", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(baseRow as never);

    const project = await getProjectBySlug("en", "website-ekonomi");

    expect(project?.title).toBe("Economics Website");
  });
});
