import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-redirect";

/**
 * `next` sampai ke sini dari query string tautan email, dan dipakai setelah
 * sesi pengguna menyala. Sebuah lolosan di sini berarti open redirect pada
 * momen ketika pengguna paling percaya — persis setelah mengeklik tautan resmi.
 */
describe("safeNext", () => {
  it("keeps a legitimate internal path", () => {
    expect(safeNext("/en/dashboard", "en")).toBe("/en/dashboard");
    expect(safeNext("/id/dashboard/projects", "id")).toBe(
      "/id/dashboard/projects",
    );
    expect(safeNext("/en", "en")).toBe("/en");
  });

  it("falls back when nothing is supplied", () => {
    expect(safeNext(null, "id")).toBe("/id/dashboard");
    expect(safeNext(undefined, "en")).toBe("/en/dashboard");
    expect(safeNext("", "en")).toBe("/en/dashboard");
  });

  // Yang paling berbahaya: browser membaca `//host` sebagai URL
  // protocol-relative, jadi `https://situs` + `//evil.com` mendarat di evil.com.
  it("rejects protocol-relative escapes", () => {
    expect(safeNext("//evil.com", "en")).toBe("/en/dashboard");
    expect(safeNext("//evil.com/en/dashboard", "en")).toBe("/en/dashboard");
    expect(safeNext("/\\evil.com", "en")).toBe("/en/dashboard");
    expect(safeNext("/\\/evil.com", "en")).toBe("/en/dashboard");
  });

  it("rejects absolute URLs", () => {
    expect(safeNext("https://evil.com", "en")).toBe("/en/dashboard");
    expect(safeNext("http://evil.com/en/dashboard", "en")).toBe(
      "/en/dashboard",
    );
    expect(safeNext("javascript:alert(1)", "en")).toBe("/en/dashboard");
    expect(safeNext("data:text/html,<script>", "en")).toBe("/en/dashboard");
  });

  // `/enemy` berawalan "en" tapi bukan locale "en" — pemeriksaan berbasis
  // startsWith akan meloloskannya.
  it("does not mistake a longer segment for a locale", () => {
    expect(safeNext("/enemy", "en")).toBe("/en/dashboard");
    expect(safeNext("/identity/theft", "id")).toBe("/id/dashboard");
  });

  it("rejects paths outside the known locales", () => {
    expect(safeNext("/fr/dashboard", "en")).toBe("/en/dashboard");
    expect(safeNext("/dashboard", "en")).toBe("/en/dashboard");
    expect(safeNext("dashboard", "en")).toBe("/en/dashboard");
  });

  it("rejects traversal and encoded payloads", () => {
    expect(safeNext("/en/../../evil", "en")).toBe("/en/dashboard");
    expect(safeNext("/en/%2e%2e/evil", "en")).toBe("/en/dashboard");
    expect(safeNext("/en/dashboard?x=1", "en")).toBe("/en/dashboard");
    expect(safeNext("/en/dashboard#frag", "en")).toBe("/en/dashboard");
    expect(safeNext("/en/dash board", "en")).toBe("/en/dashboard");
  });
});
