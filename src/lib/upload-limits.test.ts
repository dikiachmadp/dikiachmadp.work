import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  totalFileBytes,
  uploadRejectionReason,
} from "@/lib/upload-limits";

const MB = 1024 * 1024;

/** File cukup dibuat seukurannya saja — tidak ada isi yang dibaca. */
const file = (name: string, megabytes: number) =>
  ({ name, size: Math.round(megabytes * MB) }) as File;

describe("upload limits", () => {
  // Batas total harus di bawah bodySizeLimit di next.config.ts (8mb), karena
  // body HTTP mentah juga memuat boundary dan header multipart.
  it("leaves room under the server action body limit", () => {
    expect(MAX_TOTAL_BYTES).toBeLessThan(8 * MB);
    expect(MAX_FILE_BYTES).toBeLessThan(MAX_TOTAL_BYTES);
  });

  it("adds up the selection", () => {
    expect(totalFileBytes([])).toBe(0);
    expect(totalFileBytes([file("a.webp", 1), file("b.webp", 2)])).toBe(3 * MB);
  });
});

describe("uploadRejectionReason", () => {
  it("accepts an ordinary selection", () => {
    expect(uploadRejectionReason([])).toBeNull();
    expect(
      uploadRejectionReason([file("cover.webp", 1), file("logo.webp", 0.1)]),
    ).toBeNull();
  });

  it("accepts a gallery that would exceed the per-file limit in total", () => {
    // Justru kasus inilah yang rusak kalau bodySizeLimit diturunkan ke 4-5mb.
    const gallery = [1, 1, 1, 1, 1].map((mb, i) => file(`g${i}.webp`, mb));
    expect(uploadRejectionReason(gallery)).toBeNull();
    expect(totalFileBytes(gallery)).toBeGreaterThan(MAX_FILE_BYTES);
  });

  it("names the offending file when one is too large", () => {
    const reason = uploadRejectionReason([
      file("ok.webp", 1),
      file("huge.png", 6),
      file("also-ok.webp", 1),
    ]);
    expect(reason).toContain("huge.png");
    expect(reason).toContain("6.0 MB");
  });

  // Per-berkas diperiksa lebih dulu: "berkas X kebesaran" bisa ditindaklanjuti,
  // "totalnya kebesaran" tidak.
  it("reports the oversized file rather than the total", () => {
    const reason = uploadRejectionReason([
      file("huge.png", 6),
      file("other.webp", 3),
    ]);
    expect(reason).toContain("huge.png");
  });

  it("rejects a selection that only fails on the total", () => {
    const files = [1, 2, 3, 4].map((mb) => file(`g${mb}.webp`, mb));
    const reason = uploadRejectionReason(files);
    expect(reason).not.toBeNull();
    expect(reason).toContain("beberapa tahap");
    expect(files.every((f) => f.size <= MAX_FILE_BYTES)).toBe(true);
  });
});
