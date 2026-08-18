import "server-only";
import { prisma } from "@/lib/prisma";
import type { Locale, Project } from "@/types/content";
import type {
  Project as ProjectRow,
  ProjectTranslation,
} from "@/../prisma/generated/prisma/client";

type ProjectWithTranslations = ProjectRow & {
  translations: ProjectTranslation[];
};

// Meratakan Project + translation sesuai locale (fallback ke "en") menjadi
// bentuk `Project` dari types/content agar komponen UI tetap kompatibel.
function flatten(row: ProjectWithTranslations, locale: Locale): Project {
  const tr =
    row.translations.find((t) => t.locale === locale) ??
    row.translations.find((t) => t.locale === "en");

  return {
    id: row.id,
    slug: row.slug,
    title: tr?.title ?? row.slug,
    // Kunci, bukan label. Labelnya milik copy UI dan dicari per locale saat
    // render lewat `categoryLabel()` — menyimpannya per terjemahan berarti
    // string yang sama diduplikasi tiap project dan bisa saling menyimpang.
    categoryKey: row.categoryKey,
    year: row.year,
    date: row.date,
    client: tr?.client ?? "",
    description: tr?.description ?? "",
    tags: row.tags,
    coverImage: row.coverImage,
    logoUrl: row.logoUrl ?? "",
    featured: row.featured,
    liveUrl: row.liveUrl ?? undefined,
    isLivePreview: row.isLivePreview,
    role: tr?.role ?? undefined,
    duration: tr?.duration ?? undefined,
    tools: row.tools,
    contentBlocks: toStringArray(tr?.contentBlocks),
    gallery: row.gallery,
  };
}

// contentBlocks disimpan sebagai JSONB, jadi bentuknya tidak dijamin oleh
// tipe Prisma. Validasi isinya alih-alih meng-cast buta ke string[].
function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.every((item) => typeof item === "string")
    ? (value as string[])
    : undefined;
}

export async function getProjects(
  locale: Locale,
  opts?: { featured?: boolean; take?: number },
): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: opts?.featured ? { featured: true } : undefined,
    include: { translations: true },
    orderBy: { date: "desc" },
    take: opts?.take,
  });
  return rows.map((row) => flatten(row, locale));
}

export async function getProjectBySlug(
  locale: Locale,
  slug: string,
): Promise<Project | null> {
  const row = await prisma.project.findUnique({
    where: { slug },
    include: { translations: true },
  });
  return row ? flatten(row, locale) : null;
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const rows = await prisma.project.findMany({
    select: { slug: true },
    orderBy: { date: "desc" },
  });
  return rows.map((row) => row.slug);
}

// --- Fungsi admin ---

export type ProjectTranslationInput = {
  title: string;
  client: string;
  description: string;
  role?: string;
  duration?: string;
  contentBlocks?: string[];
};

export type ProjectInput = {
  slug: string;
  categoryKey: string;
  year: string;
  date: string;
  coverImage: string;
  logoUrl?: string;
  featured: boolean;
  liveUrl?: string;
  isLivePreview: boolean;
  tags: string[];
  tools: string[];
  gallery: string[];
  translations: { en: ProjectTranslationInput; id: ProjectTranslationInput };
};

const translationLocales = ["en", "id"] as const;

function baseData(input: ProjectInput) {
  return {
    slug: input.slug,
    categoryKey: input.categoryKey,
    year: input.year,
    date: input.date,
    coverImage: input.coverImage,
    logoUrl: input.logoUrl ?? null,
    featured: input.featured,
    liveUrl: input.liveUrl || null,
    isLivePreview: input.isLivePreview,
    tags: input.tags,
    tools: input.tools,
    gallery: input.gallery,
  };
}

export async function getProjectsPage({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      include: { translations: { where: { locale: "en" } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.project.count(),
  ]);
  return { rows, total };
}

export async function getProjectForEdit(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { translations: true },
  });
}

export async function createProjectWithTranslations(input: ProjectInput) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({ data: baseData(input) });
    await tx.projectTranslation.createMany({
      data: translationLocales.map((locale) => ({
        projectId: project.id,
        locale,
        ...input.translations[locale],
      })),
    });
    return project;
  });
}

export async function updateProjectWithTranslations(
  id: string,
  input: ProjectInput,
) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({
      where: { id },
      data: baseData(input),
    });
    for (const locale of translationLocales) {
      await tx.projectTranslation.upsert({
        where: { projectId_locale: { projectId: id, locale } },
        create: { projectId: id, locale, ...input.translations[locale] },
        update: input.translations[locale],
      });
    }
    return project;
  });
}

export async function deleteProjectById(id: string) {
  return prisma.project.delete({ where: { id } });
}
