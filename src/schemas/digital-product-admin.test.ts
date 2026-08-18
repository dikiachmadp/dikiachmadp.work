import { describe, expect, it } from "vitest";
import {
  digitalProductFormSchema,
  digitalProductInputFromForm,
  toFieldErrors,
} from "@/schemas/admin";

function buildFormData(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    status: "PUBLISHED",
    publishedAt: "2026-08-18T09:30",
    featured: "on",
    order: "0",
    price: "19.99",
    currency: "USD",
    buyUrl: "https://gumroad.com/l/x",
    coverImage: "/covers/1.webp",
    gallery: "",
    tags: "OJS",
    "translations.en.slug": "a-product",
    "translations.en.title": "A product",
    "translations.en.summary": "Short summary",
    "translations.en.body": "# Heading\n\nSome **words**.",
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value !== "__hapus__") formData.set(key, value);
  }
  return formData;
}

function parse(overrides: Record<string, string> = {}) {
  return digitalProductFormSchema.safeParse(
    digitalProductInputFromForm(buildFormData(overrides)),
  );
}

function errors(result: ReturnType<typeof parse>) {
  return result.success ? {} : toFieldErrors(result.error);
}

describe("digitalProductInputFromForm", () => {
  it("splits gallery and tags on newlines/commas", () => {
    const input = digitalProductInputFromForm(
      buildFormData({
        gallery: "/g/1.webp\n/g/2.webp",
        tags: "OJS, Template",
      }),
    );

    expect(input.gallery).toEqual(["/g/1.webp", "/g/2.webp"]);
    expect(input.tags).toEqual(["OJS", "Template"]);
  });

  it("turns an entirely empty language block into null", () => {
    const input = digitalProductInputFromForm(buildFormData());

    expect(input.translations.id).toBeNull();
    expect(input.translations.en).not.toBeNull();
  });
});

describe("digitalProductFormSchema", () => {
  it("accepts a product that exists in one language only", () => {
    const result = parse();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.translations.id).toBeNull();
      expect(result.data.translations.en?.slug).toBe("a-product");
      expect(result.data.price).toBe("19.99");
    }
  });

  it("treats an empty price as null, not a validation error", () => {
    const result = parse({ price: "" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBeNull();
  });

  it("rejects a malformed price", () => {
    const result = parse({ price: "free" });

    expect(errors(result)).toHaveProperty("price");
  });

  it("rejects a product with no language filled in", () => {
    const result = digitalProductFormSchema.safeParse(
      digitalProductInputFromForm(
        buildFormData({
          "translations.en.slug": "__hapus__",
          "translations.en.title": "__hapus__",
          "translations.en.summary": "__hapus__",
          "translations.en.body": "__hapus__",
        }),
      ),
    );

    expect(result.success).toBe(false);
    expect(errors(result)).toHaveProperty("translations");
  });

  it("rejects a slug outside [a-z0-9-]", () => {
    expect(
      errors(parse({ "translations.en.slug": "Judul Produk" })),
    ).toHaveProperty("translations.en.slug");
  });

  it("rejects a malformed buy URL", () => {
    expect(errors(parse({ buyUrl: "not-a-url" }))).toHaveProperty("buyUrl");
  });

  it("requires a cover image", () => {
    expect(errors(parse({ coverImage: "" }))).toHaveProperty("coverImage");
  });

  it("clears the date on a draft", () => {
    const result = parse({ status: "DRAFT" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.publishedAt).toBeNull();
  });

  it("publishes now when the date is left empty on a published product", () => {
    const before = Date.now();
    const result = parse({ publishedAt: "" });
    const after = Date.now();

    expect(result.success).toBe(true);
    if (result.success) {
      const time = result.data.publishedAt?.getTime() ?? 0;
      expect(time).toBeGreaterThanOrEqual(before);
      expect(time).toBeLessThanOrEqual(after);
    }
  });
});
