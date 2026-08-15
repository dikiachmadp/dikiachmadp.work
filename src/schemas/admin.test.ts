import { describe, expect, it } from "vitest";
import {
  projectFormSchema,
  projectInputFromForm,
  testimonialFormSchema,
  toFieldErrors,
} from "@/schemas/admin";

function buildProjectFormData(
  overrides: Record<string, string> = {},
): FormData {
  const base: Record<string, string> = {
    slug: "project-baru",
    categoryKey: "web-design",
    year: "2026",
    date: "2026-07-13",
    coverImage: "/covers/a.webp",
    logoUrl: "",
    accent: "#112233",
    liveUrl: "https://example.com",
    tags: "Web Design, UI",
    tools: "React, TypeScript",
    gallery: "/g/1.webp\n/g/2.webp",
    featured: "on",
    "translations.en.title": "New Project",
    "translations.en.client": "Acme",
    "translations.en.description": "English description",
    "translations.en.contentBlocks": "Para one.\n\nPara two.",
    "translations.id.title": "Project Baru",
    "translations.id.client": "Acme",
    "translations.id.description": "Deskripsi Indonesia",
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value !== "__hapus__") formData.set(key, value);
  }
  return formData;
}

describe("projectInputFromForm + projectFormSchema", () => {
  it("memparse form valid: list dipecah dan paragraf dipisah", () => {
    const input = projectInputFromForm(buildProjectFormData());
    const parsed = projectFormSchema.safeParse(input);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tags).toEqual(["Web Design", "UI"]);
      expect(parsed.data.gallery).toEqual(["/g/1.webp", "/g/2.webp"]);
      expect(parsed.data.featured).toBe(true);
      expect(parsed.data.isLivePreview).toBe(false);
      expect(parsed.data.translations.en.contentBlocks).toEqual([
        "Para one.",
        "Para two.",
      ]);
      expect(parsed.data.translations.id.contentBlocks).toBeUndefined();
    }
  });

  it("menolak slug berformat salah dengan error pada field slug", () => {
    const input = projectInputFromForm(
      buildProjectFormData({ slug: "Slug Salah!" }),
    );
    const parsed = projectFormSchema.safeParse(input);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(toFieldErrors(parsed.error)).toHaveProperty("slug");
    }
  });

  it("menolak terjemahan kosong dengan path bertitik", () => {
    const input = projectInputFromForm(
      buildProjectFormData({ "translations.id.title": "" }),
    );
    const parsed = projectFormSchema.safeParse(input);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(toFieldErrors(parsed.error)).toHaveProperty(
        "translations.id.title",
      );
    }
  });
});

describe("testimonialFormSchema", () => {
  it("meng-coerce order menjadi angka", () => {
    const parsed = testimonialFormSchema.safeParse({
      locale: "en",
      name: "David",
      role: "Client",
      content: "Great work",
      order: "3",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.order).toBe(3);
  });

  it("menolak locale tak dikenal", () => {
    const parsed = testimonialFormSchema.safeParse({
      locale: "fr",
      name: "David",
      role: "Client",
      content: "Great work",
      order: "0",
    });

    expect(parsed.success).toBe(false);
  });
});
