import { describe, expect, it } from "vitest";
import { categoryLabel, projectCategories } from "@/lib/categories";
import { ProjectsContentSchema } from "@/schemas/content";
import en from "@/content/en/projects.json";
import id from "@/content/id/projects.json";

/**
 * Kategori dulu disimpan sebagai label di dua tempat sekaligus: daftar chip di
 * `projects.json` dan kolom `ProjectTranslation.category`. Filter publik
 * membandingkan keduanya sebagai string, jadi menerjemahkan salah satunya
 * membuat chip berhenti mencocokkan apa pun — tanpa error, hanya daftar kosong.
 *
 * Sekarang `key` yang jadi kontrak dan `label` bebas diterjemahkan. Test di
 * sini menjaga kontrak itu.
 */
describe("daftar kategori", () => {
  it("parses against the schema in both languages", () => {
    expect(() => ProjectsContentSchema.parse(en)).not.toThrow();
    expect(() => ProjectsContentSchema.parse(id)).not.toThrow();
  });

  // Kunci adalah kontrak lintas bahasa: kalau daftarnya berbeda, satu bahasa
  // punya chip yang tidak pernah cocok dengan project mana pun.
  it("uses the same key set in both languages, in the same order", () => {
    expect(projectCategories("id").map((c) => c.key)).toEqual(
      projectCategories("en").map((c) => c.key),
    );
  });

  it("has no duplicate keys", () => {
    const keys = projectCategories("en").map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // Inti dari seluruh perubahan ini: label ID memang berbeda dari EN. Kalau
  // test ini gagal, kategori kembali tidak diterjemahkan.
  it("actually translates the labels that have an Indonesian form", () => {
    expect(categoryLabel("id", "web-design")).toBe("Desain Web");
    expect(categoryLabel("id", "packaging")).toBe("Kemasan");
    expect(categoryLabel("id", "illustration")).toBe("Ilustrasi");
    expect(categoryLabel("en", "web-design")).toBe("Web Design");
  });

  // "Branding" memang dipakai apa adanya di Indonesia, jadi label yang sama
  // di sini bukan terjemahan yang terlewat.
  it("leaves loanwords alone", () => {
    expect(categoryLabel("id", "branding")).toBe("Branding");
  });
});

describe("categoryLabel", () => {
  /**
   * Sebuah project di database bisa memakai kunci yang kemudian dihapus dari
   * JSON. Yang tampil kemudian adalah kunci mentahnya — jelek, tapi bisa
   * dilacak; kartu tanpa kategori sama sekali tidak.
   */
  it("falls back to the key itself when it has no label", () => {
    expect(categoryLabel("id", "kategori-yang-dihapus")).toBe(
      "kategori-yang-dihapus",
    );
  });

  it("does not fall back to the English label for a known key", () => {
    expect(categoryLabel("id", "3d-modeling")).toBe("Pemodelan 3D");
  });
});
