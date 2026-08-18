import { describe, expect, it } from "vitest";
import {
  logbookFormSchema,
  logbookInputFromForm,
  MAX_BODY_BYTES,
  toDateTimeLocalUtc,
  toFieldErrors,
} from "@/schemas/admin";

/**
 * Form Logbook mengirim galeri sebagai field berindeks
 * (`translations.en.images.0.alt`), dan blok bahasa yang dikosongkan seluruhnya
 * harus jadi `null` — bukan objek berisi string kosong yang lolos ke database.
 */
function buildFormData(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    status: "PUBLISHED",
    publishedAt: "2026-08-15T09:30",
    "translations.en.slug": "a-post",
    "translations.en.title": "A post",
    "translations.en.excerpt": "Short summary",
    "translations.en.body": "# Heading\n\nSome **words**.",
    "translations.en.images.0.url": "/g/1.webp",
    "translations.en.images.0.alt": "A drawing",
    "translations.en.images.0.caption": "",
  };
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value !== "__hapus__") formData.set(key, value);
  }
  return formData;
}

function parse(overrides: Record<string, string> = {}) {
  return logbookFormSchema.safeParse(
    logbookInputFromForm(buildFormData(overrides)),
  );
}

function errors(result: ReturnType<typeof parse>) {
  return result.success ? {} : toFieldErrors(result.error);
}

describe("logbookInputFromForm", () => {
  it("reads an indexed gallery in form order", () => {
    const formData = buildFormData({
      "translations.en.images.1.url": "/g/2.webp",
      "translations.en.images.1.alt": "Second",
      "translations.en.images.1.caption": "A caption",
    });

    const input = logbookInputFromForm(formData);

    expect(input.translations.en?.images).toEqual([
      { url: "/g/1.webp", alt: "A drawing", caption: undefined },
      { url: "/g/2.webp", alt: "Second", caption: "A caption" },
    ]);
  });

  // Sebuah gambar yang dihapus di tengah daftar akan menyisakan lubang indeks
  // kalau form tidak menomori ulang; parser berhenti di lubang pertama, jadi
  // penomoran ulang di klien bukan pilihan gaya.
  it("stops at the first missing index", () => {
    const formData = buildFormData({
      "translations.en.images.2.url": "/g/3.webp",
      "translations.en.images.2.alt": "Third",
    });

    expect(logbookInputFromForm(formData).translations.en?.images).toHaveLength(
      1,
    );
  });

  it("turns an entirely empty language block into null", () => {
    const input = logbookInputFromForm(buildFormData());

    expect(input.translations.id).toBeNull();
    expect(input.translations.en).not.toBeNull();
  });
});

describe("logbookFormSchema", () => {
  it("accepts a post that exists in one language only", () => {
    const result = parse();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.translations.id).toBeNull();
      expect(result.data.translations.en?.slug).toBe("a-post");
    }
  });

  // Pos tanpa satu pun terjemahan tidak muncul di mana pun — menyimpannya hanya
  // menghasilkan baris hantu di dasbor.
  it("rejects a post with no language filled in", () => {
    const result = logbookFormSchema.safeParse(
      logbookInputFromForm(
        buildFormData({
          "translations.en.slug": "__hapus__",
          "translations.en.title": "__hapus__",
          "translations.en.excerpt": "__hapus__",
          "translations.en.body": "__hapus__",
          "translations.en.images.0.url": "__hapus__",
          "translations.en.images.0.alt": "__hapus__",
          "translations.en.images.0.caption": "__hapus__",
        }),
      ),
    );

    expect(result.success).toBe(false);
    expect(errors(result)).toHaveProperty("translations");
  });

  it("rejects a slug outside [a-z0-9-]", () => {
    expect(
      errors(parse({ "translations.en.slug": "Judul Pos" })),
    ).toHaveProperty("translations.en.slug");
  });

  // `![]()` didukung: Markdown.tsx merender lewat `<img>` biasa, bukan
  // next/image, justru karena body bisa menunjuk ke host mana pun — jadi
  // tidak ada lagi alasan menolaknya di sini.
  it("accepts inline Markdown images", () => {
    const result = parse({
      "translations.en.body": "Teks\n\n![gambar](/g/x.webp)",
    });

    expect(errors(result)).not.toHaveProperty("translations.en.body");
  });

  it("rejects a body over the size limit", () => {
    const result = parse({
      "translations.en.body": "a".repeat(MAX_BODY_BYTES + 1),
    });

    expect(errors(result)).toHaveProperty("translations.en.body");
  });

  // Batasnya byte, bukan karakter: teks non-ASCII memakan lebih dari satu byte
  // per karakter dan bisa melewati batas kolom walau jumlah karakternya aman.
  it("measures the body in UTF-8 bytes", () => {
    const result = parse({
      "translations.en.body": "é".repeat(MAX_BODY_BYTES / 2 + 1),
    });

    expect(errors(result)).toHaveProperty("translations.en.body");
  });

  it("rejects a gallery image without alt text", () => {
    const result = parse({ "translations.en.images.0.alt": "" });

    expect(errors(result)).toHaveProperty("translations.en.images.0.alt");
  });

  it("keeps the Zod path in step with the input name", () => {
    const result = parse({
      "translations.en.images.1.url": "/g/2.webp",
      "translations.en.images.1.alt": "",
    });

    // Nama input di GalleryEditor persis string ini; kalau keduanya berbeda,
    // pesan errornya tidak pernah sampai ke field yang salah.
    expect(errors(result)).toHaveProperty("translations.en.images.1.alt");
  });
});

/**
 * Field-nya dirender di server (UTC di Vercel) tapi diisi admin di WIB.
 * Menafsirkannya sebagai "waktu lokal" berarti nilai yang sama berarti jam yang
 * berbeda tergantung siapa yang merender, jadi kontraknya dikunci ke UTC.
 */
describe("publishedAt", () => {
  it("reads the datetime-local value as UTC", () => {
    const result = parse({ publishedAt: "2026-08-15T09:30" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publishedAt?.toISOString()).toBe(
        "2026-08-15T09:30:00.000Z",
      );
    }
  });

  it("round-trips a stored date back into the field", () => {
    expect(toDateTimeLocalUtc(new Date("2026-08-15T09:30:00.000Z"))).toBe(
      "2026-08-15T09:30",
    );
    expect(toDateTimeLocalUtc(null)).toBe("");
  });

  it("publishes now when the date is left empty", () => {
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

  // Draf tidak punya tanggal terbit, bahkan kalau field-nya terisi — kalau
  // tanggalnya ikut tersimpan, query publik hanya bergantung pada satu kolom.
  it("clears the date on a draft", () => {
    const result = parse({ status: "DRAFT" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.publishedAt).toBeNull();
  });

  it("rejects a malformed date", () => {
    expect(errors(parse({ publishedAt: "15/08/2026" }))).toHaveProperty(
      "publishedAt",
    );
  });
});
