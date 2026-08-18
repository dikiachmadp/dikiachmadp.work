import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    aboutProfile: {
      findFirst: vi.fn(),
    },
    aboutEntry: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  createAboutEntry,
  deleteAboutEntryById,
  getAboutEntriesPage,
  getAboutForEdit,
  getAboutProfile,
  updateAboutEntry,
  upsertAboutProfile,
  type AboutEntryInput,
  type AboutProfileInput,
} from "@/lib/db/about";

const validSkills = [{ category: "Design", items: ["UI/UX", "3D"] }];
const validCvItems = [{ label: "CV", href: "/cv.pdf" }];

function translation(locale: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `tr-${locale}`,
    profileId: "profile-1",
    locale,
    biography: [`Bio ${locale}`],
    sticker: `Sticker ${locale}`,
    experienceTitle: "Experience",
    skillsTitle: "Skills",
    certificationsTitle: "Certifications",
    cvNote: "note",
    skills: validSkills,
    cvItems: validCvItems,
    ...overrides,
  };
}

function profile(translations: ReturnType<typeof translation>[]) {
  return {
    id: "profile-1",
    portraitUrl: "/portrait.webp",
    updatedAt: new Date(),
    translations,
  };
}

function entry(overrides: Record<string, unknown> = {}) {
  return {
    id: "entry-1",
    kind: "EXPERIENCE" as const,
    locale: "en",
    order: 0,
    year: "2020 — now",
    title: "Designer",
    subtitle: "Somewhere",
    url: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAboutProfile", () => {
  it("returns the requested locale's translation and split entries", async () => {
    vi.mocked(prisma.aboutProfile.findFirst).mockResolvedValue(
      profile([translation("en"), translation("id")]) as never,
    );
    vi.mocked(prisma.aboutEntry.findMany).mockResolvedValue([
      entry({ id: "e1", kind: "EXPERIENCE" }),
      entry({ id: "c1", kind: "CERTIFICATION", title: "Cert" }),
    ] as never);

    const result = await getAboutProfile("id");

    expect(result?.biography).toEqual(["Bio id"]);
    expect(result?.experience).toEqual([expect.objectContaining({ id: "e1" })]);
    expect(result?.certifications).toEqual([
      expect.objectContaining({ id: "c1", title: "Cert" }),
    ]);
  });

  it("falls back to the en translation when the locale is missing", async () => {
    vi.mocked(prisma.aboutProfile.findFirst).mockResolvedValue(
      profile([translation("en")]) as never,
    );
    vi.mocked(prisma.aboutEntry.findMany).mockResolvedValue([] as never);

    const result = await getAboutProfile("id");

    expect(result?.sticker).toBe("Sticker en");
  });

  it("returns null when no profile row exists", async () => {
    vi.mocked(prisma.aboutProfile.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.aboutEntry.findMany).mockResolvedValue([] as never);

    expect(await getAboutProfile("en")).toBeNull();
  });

  it("falls back to an empty array when the skills JSON is malformed", async () => {
    vi.mocked(prisma.aboutProfile.findFirst).mockResolvedValue(
      profile([translation("en", { skills: { not: "an array" } })]) as never,
    );
    vi.mocked(prisma.aboutEntry.findMany).mockResolvedValue([] as never);

    const result = await getAboutProfile("en");

    expect(result?.skills).toEqual([]);
  });

  it("treats a missing portraitUrl as an empty string, not null", async () => {
    vi.mocked(prisma.aboutProfile.findFirst).mockResolvedValue({
      ...profile([translation("en")]),
      portraitUrl: null,
    } as never);
    vi.mocked(prisma.aboutEntry.findMany).mockResolvedValue([] as never);

    const result = await getAboutProfile("en");

    expect(result?.portraitUrl).toBe("");
  });
});

describe("getAboutForEdit", () => {
  it("returns the raw profile row with every translation", async () => {
    const row = profile([translation("en"), translation("id")]);
    vi.mocked(prisma.aboutProfile.findFirst).mockResolvedValue(row as never);

    const result = await getAboutForEdit();

    expect(result?.translations).toHaveLength(2);
  });
});

// --- Fungsi tulis ---

type Call = { model: string; method: string; args: unknown };

function fakeTx(existingProfile: Record<string, unknown> | null) {
  const calls: Call[] = [];
  const record =
    (model: string, method: string, result: unknown = { id: "profile-1" }) =>
    (args: unknown) => {
      calls.push({ model, method, args });
      return Promise.resolve(result);
    };

  const tx = {
    aboutProfile: {
      findFirst: record("aboutProfile", "findFirst", existingProfile),
      create: record("aboutProfile", "create"),
      update: record("aboutProfile", "update"),
    },
    aboutProfileTranslation: {
      upsert: record("aboutProfileTranslation", "upsert"),
    },
  };

  vi.mocked(prisma.$transaction).mockImplementation(((
    run: (tx: unknown) => unknown,
  ) => run(tx)) as never);
  return calls;
}

function profileInput(
  overrides: Partial<AboutProfileInput> = {},
): AboutProfileInput {
  return {
    portraitUrl: "/new-portrait.webp",
    translations: {
      en: {
        biography: ["Bio"],
        sticker: "Sticker",
        experienceTitle: "Experience",
        skillsTitle: "Skills",
        certificationsTitle: "Certifications",
        cvNote: "note",
        skills: validSkills,
        cvItems: validCvItems,
      },
      id: {
        biography: ["Bio id"],
        sticker: "Sticker id",
        experienceTitle: "Pengalaman",
        skillsTitle: "Keahlian",
        certificationsTitle: "Sertifikasi",
        cvNote: "catatan",
        skills: validSkills,
        cvItems: validCvItems,
      },
    },
    ...overrides,
  };
}

describe("upsertAboutProfile", () => {
  it("creates the profile when none exists yet, then upserts both locales", async () => {
    const calls = fakeTx(null);

    await upsertAboutProfile(profileInput());

    expect(calls.map((c) => `${c.model}.${c.method}`)).toEqual([
      "aboutProfile.findFirst",
      "aboutProfile.create",
      "aboutProfileTranslation.upsert",
      "aboutProfileTranslation.upsert",
    ]);
  });

  it("updates the existing profile instead of creating a second one", async () => {
    const calls = fakeTx({ id: "profile-1", portraitUrl: "/old.webp" });

    await upsertAboutProfile(profileInput());

    expect(calls.map((c) => `${c.model}.${c.method}`)).toContain(
      "aboutProfile.update",
    );
    expect(calls.map((c) => `${c.model}.${c.method}`)).not.toContain(
      "aboutProfile.create",
    );
  });

  // Pemanggil butuh URL lama untuk membersihkan storage kalau potretnya diganti.
  it("returns the previous portrait URL for cleanup", async () => {
    fakeTx({ id: "profile-1", portraitUrl: "/old.webp" });

    const result = await upsertAboutProfile(profileInput());

    expect(result.previousPortraitUrl).toBe("/old.webp");
  });

  it("returns null as the previous portrait when the profile is new", async () => {
    fakeTx(null);

    const result = await upsertAboutProfile(profileInput());

    expect(result.previousPortraitUrl).toBeNull();
  });
});

function entryInput(overrides: Partial<AboutEntryInput> = {}): AboutEntryInput {
  return {
    kind: "EXPERIENCE",
    locale: "en",
    order: 0,
    year: "2024 — now",
    title: "Designer",
    subtitle: "Studio",
    ...overrides,
  };
}

describe("about entry CRUD", () => {
  it("creates an entry with a null url when none is given", async () => {
    vi.mocked(prisma.aboutEntry.create).mockResolvedValue(entry() as never);

    await createAboutEntry(entryInput());

    expect(prisma.aboutEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ url: null }),
    });
  });

  it("updates an entry by id", async () => {
    vi.mocked(prisma.aboutEntry.update).mockResolvedValue(entry() as never);

    await updateAboutEntry("entry-1", entryInput({ title: "Renamed" }));

    expect(prisma.aboutEntry.update).toHaveBeenCalledWith({
      where: { id: "entry-1" },
      data: expect.objectContaining({ title: "Renamed" }),
    });
  });

  it("deletes an entry by id", async () => {
    vi.mocked(prisma.aboutEntry.delete).mockResolvedValue(entry() as never);

    await deleteAboutEntryById("entry-1");

    expect(prisma.aboutEntry.delete).toHaveBeenCalledWith({
      where: { id: "entry-1" },
    });
  });

  it("paginates the combined experience + certification list", async () => {
    vi.mocked(prisma.aboutEntry.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.aboutEntry.count).mockResolvedValue(0 as never);

    await getAboutEntriesPage({ page: 2, perPage: 10 });

    const args = vi.mocked(prisma.aboutEntry.findMany).mock.calls[0][0];
    expect(args?.skip).toBe(10);
    expect(args?.take).toBe(10);
  });
});
