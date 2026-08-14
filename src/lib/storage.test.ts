import { describe, expect, it, vi } from "vitest";

// storage.ts is server-only and builds a Supabase client at call time.
// bucketPathFromUrl is pure and touches neither.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const { bucketPathFromUrl } = await import("@/lib/storage");

const BASE =
  "https://dwkzfyiqtbminddhmqra.supabase.co/storage/v1/object/public/project-images/";

/**
 * Menghapus project memakai fungsi ini untuk mengubah URL tersimpan menjadi
 * path bucket. Kalau ia mengembalikan null untuk berkas yang sebenarnya milik
 * kita, gambarnya tertinggal dan tetap publik selamanya; kalau mengembalikan
 * path untuk URL yang bukan milik kita, penghapusan menyasar objek yang salah.
 */
describe("bucketPathFromUrl", () => {
  it("extracts the path from a bucket URL", () => {
    expect(bucketPathFromUrl(`${BASE}my-slug/abc123.webp`)).toBe(
      "my-slug/abc123.webp",
    );
  });

  it("decodes percent-encoded segments", () => {
    expect(bucketPathFromUrl(`${BASE}my-slug/a%20b.png`)).toBe(
      "my-slug/a b.png",
    );
  });

  // Project lama menunjuk ke berkas di /public, dan URL eksternal bisa masuk
  // lewat field URL di form. Keduanya bukan milik bucket dan harus dilewati.
  it("ignores URLs that are not in the bucket", () => {
    expect(bucketPathFromUrl("/projects/covers/webjahe.webp")).toBeNull();
    expect(bucketPathFromUrl("https://example.com/image.png")).toBeNull();
    expect(bucketPathFromUrl("")).toBeNull();
  });

  it("ignores a different bucket on the same host", () => {
    expect(
      bucketPathFromUrl(
        "https://dwkzfyiqtbminddhmqra.supabase.co/storage/v1/object/public/avatars/x.png",
      ),
    ).toBeNull();
  });

  it("returns null when the URL stops at the bucket root", () => {
    expect(bucketPathFromUrl(BASE)).toBeNull();
  });
});
