import { describe, expect, it } from "vitest";
import {
  LANDING_SLOTS,
  ProductLandingSchema,
  isSafeImageUrl,
  isSafeLinkUrl,
  landingImageUrls,
  localizeLanding,
  type ProductLanding,
} from "@/schemas/product-landing";

const BUCKET =
  "https://dwkzfyiqtbminddhmqra.supabase.co/storage/v1/object/public";

function text(en: string, id = en) {
  return { en, id };
}

function landing(overrides: Partial<ProductLanding> = {}): ProductLanding {
  return {
    positioning: {
      heading: text("Not a theme"),
      intro: text(""),
      items: [
        { label: text("No server"), detail: text("Journal Manager only.") },
      ],
    },
    ...overrides,
  };
}

describe("isSafeLinkUrl", () => {
  it("accepts https and root-relative paths", () => {
    expect(isSafeLinkUrl("https://polar.sh/x")).toBe(true);
    expect(isSafeLinkUrl("/id/contact")).toBe(true);
    expect(isSafeLinkUrl("")).toBe(true);
  });

  it("rejects javascript:, data: and other non-https schemes", () => {
    expect(isSafeLinkUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeLinkUrl("JavaScript:alert(1)")).toBe(false);
    expect(isSafeLinkUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeLinkUrl("http://polar.sh/x")).toBe(false);
  });

  it("rejects protocol-relative URLs, which carry a foreign host", () => {
    expect(isSafeLinkUrl("//evil.example/x")).toBe(false);
  });
});

describe("isSafeImageUrl", () => {
  it("accepts bucket URLs and local paths", () => {
    expect(isSafeImageUrl(`${BUCKET}/project-images/a.webp`)).toBe(true);
    expect(isSafeImageUrl("/images/a.webp")).toBe(true);
  });

  it("rejects foreign hosts and non-bucket paths on the right host", () => {
    expect(isSafeImageUrl("https://evil.example/a.webp")).toBe(false);
    expect(isSafeImageUrl("https://x.supabase.co/private/a.webp")).toBe(false);
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("ProductLandingSchema", () => {
  it("accepts a landing with every slot filled", () => {
    const full: ProductLanding = {
      positioning: landing().positioning,
      proof: {
        heading: text("Proof"),
        intro: text(""),
        items: [
          {
            title: text("Article sidebar"),
            detail: text("Restored."),
            beforeImage: `${BUCKET}/project-images/before.webp`,
            beforeLabel: text("Before"),
            afterImage: `${BUCKET}/project-images/after.webp`,
            afterLabel: text("After"),
          },
        ],
      },
      features: landing().positioning,
      variants: {
        heading: text("Colours"),
        intro: text(""),
        items: [
          {
            name: text("Deep Green"),
            hex: "#1f4433",
            description: text("Calm."),
            image: "",
            linkUrl: "",
          },
        ],
      },
      tiers: {
        heading: text("Two options"),
        intro: text(""),
        items: [
          {
            name: text("Complete"),
            price: text("IDR 149,000"),
            priceNote: text(""),
            summary: text(""),
            includes: { en: ["Five colours"], id: ["Lima warna"] },
            excludes: { en: [], id: [] },
            ctaLabel: text("Buy"),
            ctaUrl: "https://polar.sh/x",
            recommended: true,
          },
        ],
      },
      specs: landing().positioning,
      faq: {
        heading: text("FAQ"),
        intro: text(""),
        items: [{ question: text("Q?"), answer: text("A.") }],
      },
      gallery: {
        heading: text("Gallery"),
        intro: text(""),
        items: [{ image: "/images/a.webp", caption: text("Home") }],
      },
    };
    expect(ProductLandingSchema.safeParse(full).success).toBe(true);
  });

  it("accepts an empty object — every slot is optional", () => {
    expect(ProductLandingSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a javascript: checkout link at the field's own path", () => {
    const result = ProductLandingSchema.safeParse({
      tiers: {
        heading: text("Tiers"),
        intro: text(""),
        items: [
          {
            name: text("Free"),
            price: text("Free"),
            priceNote: text(""),
            summary: text(""),
            includes: { en: [], id: [] },
            excludes: { en: [], id: [] },
            ctaLabel: text("Get"),
            ctaUrl: "javascript:alert(1)",
            recommended: false,
          },
        ],
      },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].path.join(".")).toBe("tiers.items.0.ctaUrl");
  });

  it("rejects a malformed hex colour", () => {
    const result = ProductLandingSchema.safeParse({
      variants: {
        heading: text("Colours"),
        intro: text(""),
        items: [
          {
            name: text("X"),
            hex: "red",
            description: text(""),
            image: "",
            linkUrl: "",
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects more items than the cap allows", () => {
    const item = { label: text("a"), detail: text("b") };
    const result = ProductLandingSchema.safeParse({
      features: {
        heading: text("Features"),
        intro: text(""),
        items: Array.from({ length: 25 }, () => item),
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("localizeLanding", () => {
  it("flattens {en, id} pairs down to the requested locale", () => {
    const result = localizeLanding(
      landing({
        positioning: {
          heading: { en: "Not a theme", id: "Bukan tema" },
          intro: { en: "", id: "" },
          items: [
            {
              label: { en: "No server", id: "Tanpa server" },
              detail: { en: "Manager only.", id: "Cukup Manager." },
            },
          ],
        },
      }),
      "id",
    );
    expect(result.positioning?.heading).toBe("Bukan tema");
    expect(result.positioning?.items[0].label).toBe("Tanpa server");
  });

  it("drops a section whose heading is empty in that locale", () => {
    const result = localizeLanding(
      landing({
        positioning: {
          heading: { en: "Not a theme", id: "" },
          intro: text(""),
          items: [{ label: text("a"), detail: text("b") }],
        },
      }),
      "id",
    );
    expect(result.positioning).toBeUndefined();
  });

  it("drops items that are empty in that locale, and the section with them", () => {
    const result = localizeLanding(
      landing({
        positioning: {
          heading: { en: "Heading", id: "Judul" },
          intro: text(""),
          items: [
            { label: { en: "a", id: "" }, detail: { en: "b", id: "" } },
            { label: { en: "c", id: "ada" }, detail: text("") },
          ],
        },
      }),
      "id",
    );
    expect(result.positioning?.items).toHaveLength(1);
    expect(result.positioning?.items[0].label).toBe("ada");
  });

  it("keeps a comparison item that has images but no title", () => {
    const result = localizeLanding(
      {
        proof: {
          heading: text("Proof"),
          intro: text(""),
          items: [
            {
              title: text(""),
              detail: text(""),
              beforeImage: "/images/before.webp",
              beforeLabel: text(""),
              afterImage: "/images/after.webp",
              afterLabel: text(""),
            },
          ],
        },
      },
      "id",
    );
    expect(result.proof?.items).toHaveLength(1);
  });

  it("returns an empty object for a landing with no sections", () => {
    expect(localizeLanding({}, "en")).toEqual({});
  });
});

describe("landingImageUrls", () => {
  it("collects every image across slots, skipping empty fields", () => {
    const urls = landingImageUrls({
      proof: {
        heading: text("Proof"),
        intro: text(""),
        items: [
          {
            title: text("x"),
            detail: text(""),
            beforeImage: `${BUCKET}/project-images/before.webp`,
            beforeLabel: text(""),
            afterImage: "",
            afterLabel: text(""),
          },
        ],
      },
      gallery: {
        heading: text("Gallery"),
        intro: text(""),
        items: [{ image: "/images/a.webp", caption: text("") }],
      },
    });
    expect(urls).toEqual([
      `${BUCKET}/project-images/before.webp`,
      "/images/a.webp",
    ]);
  });
});

describe("LANDING_SLOTS", () => {
  it("describes every slot the schema declares, and no others", () => {
    const declared = Object.keys(ProductLandingSchema.shape).sort();
    const described = LANDING_SLOTS.map((spec) => spec.slot).sort();
    expect(described).toEqual(declared);
  });

  it("only requires field names that the slot actually declares", () => {
    for (const spec of LANDING_SLOTS) {
      const names = spec.fields.map((field) => field.name);
      for (const required of spec.requires) {
        expect(names).toContain(required);
      }
    }
  });
});
