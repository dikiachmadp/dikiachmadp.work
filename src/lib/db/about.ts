import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/types/content";
import type {
  AboutEntry,
  AboutEntryKind,
  AboutProfile,
  AboutProfileTranslation,
} from "@/../prisma/generated/prisma/client";

export type AboutSkillGroup = { category: string; items: string[] };
export type AboutCvItem = { label: string; href: string };

export type AboutEntryItem = {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  url?: string;
};

export type AboutProfileData = {
  portraitUrl: string;
  biography: string[];
  sticker: string;
  experienceTitle: string;
  skillsTitle: string;
  certificationsTitle: string;
  cvNote: string;
  skills: AboutSkillGroup[];
  cvItems: AboutCvItem[];
  experience: AboutEntryItem[];
  certifications: AboutEntryItem[];
};

const skillsSchema = z.array(
  z.object({ category: z.string(), items: z.array(z.string()) }),
);
const cvItemsSchema = z.array(
  z.object({ label: z.string(), href: z.string() }),
);

// `skills` dan `cvItems` disimpan sebagai JSONB, jadi bentuknya tidak dijamin
// oleh tipe Prisma. Divalidasi di sini alih-alih di-cast buta ke array kosong
// bila datanya rusak — pola yang sama dengan `contentBlocks` di projects.ts.
function parseSkills(value: unknown): AboutSkillGroup[] {
  const result = skillsSchema.safeParse(value);
  return result.success ? result.data : [];
}

function parseCvItems(value: unknown): AboutCvItem[] {
  const result = cvItemsSchema.safeParse(value);
  return result.success ? result.data : [];
}

function toEntryItem(row: AboutEntry): AboutEntryItem {
  return {
    id: row.id,
    year: row.year,
    title: row.title,
    subtitle: row.subtitle,
    url: row.url ?? undefined,
  };
}

/**
 * Profil About untuk halaman publik. Jatuh ke terjemahan "en" bila locale
 * yang diminta tidak tersedia — About selalu harus tampil di kedua bahasa,
 * berbeda dari Logbook yang boleh hilang di satu bahasa.
 *
 * Entri pengalaman/sertifikasi TIDAK ikut jatuh ke "en": keduanya baris per
 * bahasa seperti Testimonial, bukan tabel terjemahan, jadi daftarnya boleh
 * tidak sinkron antar bahasa secara sengaja.
 */
export async function getAboutProfile(
  locale: Locale,
): Promise<AboutProfileData | null> {
  const [profile, entries] = await Promise.all([
    prisma.aboutProfile.findFirst({ include: { translations: true } }),
    prisma.aboutEntry.findMany({
      where: { locale },
      orderBy: { order: "asc" },
    }),
  ]);
  if (!profile) return null;

  const tr =
    profile.translations.find((t) => t.locale === locale) ??
    profile.translations.find((t) => t.locale === "en");
  if (!tr) return null;

  return {
    portraitUrl: profile.portraitUrl ?? "",
    biography: tr.biography,
    sticker: tr.sticker,
    experienceTitle: tr.experienceTitle,
    skillsTitle: tr.skillsTitle,
    certificationsTitle: tr.certificationsTitle,
    cvNote: tr.cvNote,
    skills: parseSkills(tr.skills),
    cvItems: parseCvItems(tr.cvItems),
    experience: entries.filter((e) => e.kind === "EXPERIENCE").map(toEntryItem),
    certifications: entries
      .filter((e) => e.kind === "CERTIFICATION")
      .map(toEntryItem),
  };
}

// --- Fungsi admin ---

const translationLocales = ["en", "id"] as const;

export type AboutProfileTranslationInput = {
  biography: string[];
  sticker: string;
  experienceTitle: string;
  skillsTitle: string;
  certificationsTitle: string;
  cvNote: string;
  skills: AboutSkillGroup[];
  cvItems: AboutCvItem[];
};

export type AboutProfileInput = {
  /** `null` berarti tanpa potret — halaman publik jatuh ke `/foto.webp`. */
  portraitUrl: string | null;
  translations: Record<Locale, AboutProfileTranslationInput>;
};

export type AboutProfileForEdit = AboutProfile & {
  translations: AboutProfileTranslation[];
};

/**
 * Satu-satunya profil dipakai lewat form tunggal di admin, jadi pemanggil
 * tidak perlu tahu id-nya. `null` hanya mungkin kalau seed migrasi belum
 * pernah jalan — `upsertAboutProfile` membuatnya sendiri kalau perlu.
 */
export async function getAboutForEdit(): Promise<AboutProfileForEdit | null> {
  return prisma.aboutProfile.findFirst({ include: { translations: true } });
}

/**
 * Mengembalikan `portraitUrl` lama supaya pemanggil bisa membersihkannya dari
 * storage kalau diganti — pola yang sama dengan `updatePostWithTranslations`.
 */
export async function upsertAboutProfile(input: AboutProfileInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.aboutProfile.findFirst();
    const previousPortraitUrl = existing?.portraitUrl ?? null;

    const profile = existing
      ? await tx.aboutProfile.update({
          where: { id: existing.id },
          data: { portraitUrl: input.portraitUrl },
        })
      : await tx.aboutProfile.create({
          data: { portraitUrl: input.portraitUrl },
        });

    for (const locale of translationLocales) {
      const t = input.translations[locale];
      await tx.aboutProfileTranslation.upsert({
        where: { profileId_locale: { profileId: profile.id, locale } },
        create: { profileId: profile.id, locale, ...t },
        update: { ...t },
      });
    }

    return { profile, previousPortraitUrl };
  });
}

export type AboutEntryInput = {
  kind: AboutEntryKind;
  locale: Locale;
  order: number;
  year: string;
  title: string;
  subtitle: string;
  url?: string;
};

function entryData(input: AboutEntryInput) {
  return {
    kind: input.kind,
    locale: input.locale,
    order: input.order,
    year: input.year,
    title: input.title,
    subtitle: input.subtitle,
    url: input.url ?? null,
  };
}

export async function getAboutEntriesPage({
  page,
  perPage,
}: {
  page: number;
  perPage: number;
}) {
  const [rows, total] = await Promise.all([
    prisma.aboutEntry.findMany({
      orderBy: [{ kind: "asc" }, { locale: "asc" }, { order: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.aboutEntry.count(),
  ]);
  return { rows, total };
}

export async function getAboutEntryById(id: string) {
  return prisma.aboutEntry.findUnique({ where: { id } });
}

export async function createAboutEntry(input: AboutEntryInput) {
  return prisma.aboutEntry.create({ data: entryData(input) });
}

export async function updateAboutEntry(id: string, input: AboutEntryInput) {
  return prisma.aboutEntry.update({ where: { id }, data: entryData(input) });
}

export async function deleteAboutEntryById(id: string) {
  return prisma.aboutEntry.delete({ where: { id } });
}
