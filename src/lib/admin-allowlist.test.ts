import { describe, expect, it } from "vitest";

import { isAdminEmail, parseAdminEmails } from "@/lib/admin-allowlist";
import { safeNext } from "@/lib/safe-redirect";

describe("parseAdminEmails", () => {
  it("memecah daftar berkoma dan menormalkan huruf besar/spasi", () => {
    expect(parseAdminEmails(" Admin@Example.com , dua@example.com ")).toEqual([
      "admin@example.com",
      "dua@example.com",
    ]);
  });

  it("mengabaikan entri kosong", () => {
    expect(parseAdminEmails("a@b.com,,  ,")).toEqual(["a@b.com"]);
  });

  it("mengembalikan daftar kosong untuk nilai yang tidak diset", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
  });
});

describe("isAdminEmail", () => {
  const allowlist = ["admin@example.com"];

  it("menerima email di allowlist tanpa peduli kapitalisasi", () => {
    expect(isAdminEmail("Admin@Example.COM", allowlist)).toBe(true);
  });

  it("menolak email di luar allowlist", () => {
    expect(isAdminEmail("penyusup@example.com", allowlist)).toBe(false);
  });

  it("menolak email kosong", () => {
    expect(isAdminEmail(null, allowlist)).toBe(false);
    expect(isAdminEmail(undefined, allowlist)).toBe(false);
  });

  // Allowlist kosong berarti konfigurasinya hilang — jangan buka pintu.
  it("gagal tertutup saat allowlist kosong", () => {
    expect(isAdminEmail("admin@example.com", [])).toBe(false);
  });
});

describe("safeNext", () => {
  it("meneruskan path internal berawalan locale", () => {
    expect(safeNext("/en/reset-password", "en")).toBe("/en/reset-password");
    expect(safeNext("/id/dashboard/projects", "id")).toBe(
      "/id/dashboard/projects",
    );
  });

  it("menolak URL protocol-relative yang keluar ke domain lain", () => {
    expect(safeNext("//evil.com", "en")).toBe("/en/dashboard");
    expect(safeNext("/\\evil.com", "en")).toBe("/en/dashboard");
  });

  it("menolak URL absolut", () => {
    expect(safeNext("https://evil.com", "en")).toBe("/en/dashboard");
    expect(safeNext("javascript:alert(1)", "en")).toBe("/en/dashboard");
  });

  it("menolak path tanpa prefix locale yang dikenal", () => {
    expect(safeNext("/fr/dashboard", "en")).toBe("/en/dashboard");
    expect(safeNext("/dashboard", "en")).toBe("/en/dashboard");
  });

  it("jatuh ke dashboard locale saat next tidak ada", () => {
    expect(safeNext(null, "id")).toBe("/id/dashboard");
    expect(safeNext("", "en")).toBe("/en/dashboard");
  });
});
