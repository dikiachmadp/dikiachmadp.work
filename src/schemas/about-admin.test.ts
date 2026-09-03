import { describe, expect, it } from "vitest";
import {
  aboutEntryFormSchema,
  aboutEntryInputFromForm,
  aboutProfileFormSchema,
  aboutProfileInputFromForm,
  cvItemsToText,
  parseCvItemsText,
  parseSkillsText,
  skillsToText,
  toFieldErrors,
} from "@/schemas/admin";

describe("skills text format", () => {
  it("parses one category per line", () => {
    const result = parseSkillsText(
      "Design: Brand Identity, UI/UX, 3D\nTools: Figma, Blender",
    );

    expect(result).toEqual([
      { category: "Design", items: ["Brand Identity", "UI/UX", "3D"] },
      { category: "Tools", items: ["Figma", "Blender"] },
    ]);
  });

  it("ignores blank lines", () => {
    expect(parseSkillsText("Design: UI/UX\n\n\nTools: Figma")).toHaveLength(2);
  });

  it("returns an empty array for null input", () => {
    expect(parseSkillsText(null)).toEqual([]);
  });

  it("round-trips through skillsToText", () => {
    const skills = [{ category: "Design", items: ["UI/UX", "3D"] }];
    expect(parseSkillsText(skillsToText(skills))).toEqual(skills);
  });
});

describe("cv items text format", () => {
  it("parses label and href separated by a pipe", () => {
    const result = parseCvItemsText(
      "CV — English | /CV_Diki.pdf\nCV — Bahasa | /CV_Diki_ID.pdf",
    );

    expect(result).toEqual([
      { label: "CV — English", href: "/CV_Diki.pdf" },
      { label: "CV — Bahasa", href: "/CV_Diki_ID.pdf" },
    ]);
  });

  it("round-trips through cvItemsToText", () => {
    const items = [{ label: "CV", href: "/cv.pdf" }];
    expect(parseCvItemsText(cvItemsToText(items))).toEqual(items);
  });

  it("returns an empty array for null input", () => {
    expect(parseCvItemsText(null)).toEqual([]);
  });
});

function buildAboutFormData(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    portraitUrl: "/portrait.webp",
    "translations.en.biography": "Paragraph one.\n\nParagraph two.",
    "translations.en.sticker": "hi, that's me",
    "translations.en.experienceTitle": "Experience",
    "translations.en.skillsTitle": "Skills",
    "translations.en.certificationsTitle": "Certifications",
    "translations.en.cvNote": "grab my CV",
    "translations.en.skills": "Design: UI/UX, 3D",
    "translations.en.cvItems": "CV | /cv.pdf",
    "translations.id.biography": "Paragraf satu.",
    "translations.id.sticker": "halo, itu saya",
    "translations.id.experienceTitle": "Pengalaman",
    "translations.id.skillsTitle": "Keahlian",
    "translations.id.certificationsTitle": "Sertifikasi",
    "translations.id.cvNote": "unduh CV",
    "translations.id.skills": "Desain: UI/UX, 3D",
    "translations.id.cvItems": "CV | /cv.pdf",
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    formData.set(key, value);
  }
  return formData;
}

function parseProfile(overrides: Record<string, string> = {}) {
  return aboutProfileFormSchema.safeParse(
    aboutProfileInputFromForm(buildAboutFormData(overrides)),
  );
}

describe("aboutProfileInputFromForm + aboutProfileFormSchema", () => {
  it("accepts a fully filled bilingual profile", () => {
    const result = parseProfile();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.translations.en.skills).toEqual([
        { category: "Design", items: ["UI/UX", "3D"] },
      ]);
      expect(result.data.translations.en.cvItems).toEqual([
        { label: "CV", href: "/cv.pdf" },
      ]);
      expect(result.data.translations.en.biography).toEqual([
        "Paragraph one.",
        "Paragraph two.",
      ]);
    }
  });

  it("rejects an empty biography", () => {
    const result = parseProfile({ "translations.en.biography": "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error)).toHaveProperty(
        "translations.en.biography",
      );
    }
  });

  it("rejects a skills line with no items", () => {
    const result = parseProfile({ "translations.en.skills": "Design:" });

    expect(result.success).toBe(false);
  });

  it("requires both languages — id is not optional like Logbook", () => {
    const result = parseProfile({
      "translations.id.sticker": "",
      "translations.id.experienceTitle": "",
      "translations.id.skillsTitle": "",
      "translations.id.certificationsTitle": "",
      "translations.id.cvNote": "",
      "translations.id.biography": "",
    });

    expect(result.success).toBe(false);
  });
});

function entryFormData(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    kind: "EXPERIENCE",
    locale: "en",
    order: "0",
    year: "2024 — now",
    title: "Designer",
    subtitle: "Studio",
    url: "",
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    formData.set(key, value);
  }
  return formData;
}

describe("aboutEntryInputFromForm + aboutEntryFormSchema", () => {
  it("accepts a valid experience entry", () => {
    const result = aboutEntryFormSchema.safeParse(
      aboutEntryInputFromForm(entryFormData()),
    );

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.order).toBe(0);
  });

  it("coerces order to a number", () => {
    const result = aboutEntryFormSchema.safeParse(
      aboutEntryInputFromForm(entryFormData({ order: "5" })),
    );

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.order).toBe(5);
  });

  it("accepts a certification with a verification URL", () => {
    const result = aboutEntryFormSchema.safeParse(
      aboutEntryInputFromForm(
        entryFormData({
          kind: "CERTIFICATION",
          url: "https://example.com/verify",
        }),
      ),
    );

    expect(result.success).toBe(true);
  });

  it("rejects a malformed verification URL", () => {
    const result = aboutEntryFormSchema.safeParse(
      aboutEntryInputFromForm(entryFormData({ url: "not-a-url" })),
    );

    expect(result.success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    const result = aboutEntryFormSchema.safeParse(
      aboutEntryInputFromForm(entryFormData({ kind: "SOMETHING_ELSE" })),
    );

    expect(result.success).toBe(false);
  });
});

/**
 * Skills dan cvItems disunting sebagai satu textarea, jadi galat Zod yang
 * menunjuk elemennya (`translations.en.cvItems.0.href`) tidak pernah cocok
 * dengan nama input yang dirender (`translations.en.cvItems`). Tanpa alias di
 * `toFieldErrors`, simpanan ditolak tanpa pesan yang bisa ditemukan.
 */
describe("galat larik mendarat di textarea yang benar-benar dirender", () => {
  it("menandai textarea cvItems ketika satu baris kehilangan tautannya", () => {
    const result = parseProfile({
      "translations.en.cvItems": "CV tanpa tautan",
    });
    const fieldErrors = result.success ? {} : toFieldErrors(result.error);

    expect(fieldErrors).toHaveProperty("translations.en.cvItems");
    expect(fieldErrors["translations.en.cvItems"]).toContain("Baris 1");
  });

  it("menandai textarea skills ketika satu baris tidak punya item", () => {
    const result = parseProfile({ "translations.en.skills": "Desain:" });
    const fieldErrors = result.success ? {} : toFieldErrors(result.error);

    expect(fieldErrors).toHaveProperty("translations.en.skills");
    expect(fieldErrors["translations.en.skills"]).toContain("Baris 1");
  });
});
