import { describe, expect, it, vi } from "vitest";

// ratelimit.ts is server-only and builds a Redis client from validated env.
// Only clientIp is under test here, and it touches neither.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "token",
  },
}));

const { clientIp } = await import("@/lib/ratelimit");

const headers = (init: Record<string, string>) => new Headers(init);

/**
 * Kunci rate limit. Kalau fungsi ini mengembalikan nilai yang berbeda-beda
 * untuk klien yang sama, jatah rate limit tidak pernah habis dan batas login
 * maupun form kontak berhenti berarti.
 */
describe("clientIp", () => {
  it("takes the client from a forwarded chain", () => {
    // Formatnya `klien, proxy1, proxy2` — yang paling kiri adalah klien asli.
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.5" }))).toBe(
      "203.0.113.5",
    );
    expect(
      clientIp(headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" })),
    ).toBe("203.0.113.5");
  });

  // Memakai header utuh berarti satu klien menempati bucket berbeda tiap kali
  // rantai proxy-nya berubah.
  it("ignores proxies appended after the client", () => {
    const a = clientIp(headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }));
    const b = clientIp(headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.9" }));
    expect(a).toBe(b);
  });

  it("trims the whitespace proxies add", () => {
    expect(
      clientIp(headers({ "x-forwarded-for": "  203.0.113.5  , 70.41.3.18" })),
    ).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when there is no chain", () => {
    expect(clientIp(headers({ "x-real-ip": "198.51.100.7" }))).toBe(
      "198.51.100.7",
    );
    expect(clientIp(headers({ "x-real-ip": "  198.51.100.7 " }))).toBe(
      "198.51.100.7",
    );
  });

  it("prefers the forwarded chain over x-real-ip", () => {
    expect(
      clientIp(
        headers({
          "x-forwarded-for": "203.0.113.5",
          "x-real-ip": "198.51.100.7",
        }),
      ),
    ).toBe("203.0.113.5");
  });

  // Satu bucket bersama lebih baik daripada bucket per-request: kunci yang
  // selalu unik akan mematikan rate limiting sepenuhnya.
  it("returns a stable key when nothing identifies the caller", () => {
    expect(clientIp(headers({}))).toBe("unknown");
    expect(clientIp(headers({ "x-forwarded-for": "" }))).toBe("unknown");
    expect(clientIp(headers({ "x-forwarded-for": "   " }))).toBe("unknown");
    expect(clientIp(headers({ "x-forwarded-for": ", 10.0.0.1" }))).toBe(
      "unknown",
    );
  });
});
