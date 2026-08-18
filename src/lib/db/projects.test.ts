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
import { getProjectBySlug, getProjects } from "@/lib/db/projects";

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
