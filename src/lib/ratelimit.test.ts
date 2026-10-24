import { afterEach, describe, expect, it, vi } from "vitest";

// ratelimit.ts is server-only and builds a Redis client from validated env.
// Neither clientIp nor allowRequest touches that client: allowRequest takes the
// limiter as an argument, so a fake one stands in and no Redis is ever reached.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "token",
  },
}));

const { allowRequest, clientIp } = await import("@/lib/ratelimit");

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

/**
 * Degradasi rate limit. Sebuah host Upstash yang mati pernah menjatuhkan server
 * action login dengan 500 sebelum Supabase tersentuh — login mati total gara-gara
 * dependensi yang cuma menjaga jatah percobaan.
 */
describe("allowRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const limiter = (result: () => unknown) => ({
    limit: vi.fn(async () => result() as never),
  });

  const dead = () =>
    limiter(() => {
      throw new TypeError("fetch failed");
    });

  // Ini tes regresi untuk gangguan yang sebenarnya: host Upstash terhapus,
  // `limit()` reject, dan server action login mati dengan 500.
  it("meloloskan request ketika limiter tidak bisa dihubungi", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(allowRequest(dead(), "203.0.113.5")).resolves.toEqual({
      allowed: true,
      degraded: true,
    });
    // Gangguan yang lewat tanpa jejak adalah gangguan yang tidak pernah
    // diperbaiki.
    expect(error).toHaveBeenCalled();
  });

  // Yang membuat perubahan kebijakan form kontak jadi tindakan sadar, bukan
  // kecelakaan.
  it("menutup request ketika pemanggilnya meminta fail-closed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      allowRequest(dead(), "203.0.113.5", { failOpen: false }),
    ).resolves.toEqual({ allowed: false, degraded: true });
  });

  // Yang dimaafkan hanya kegagalan infrastruktur. Jatah yang benar-benar habis
  // tetap ditolak — kalau tidak, batas login berhenti berarti. `degraded` palsu
  // di sini akan membuat form kontak menjawab 503 untuk throttle yang asli.
  it("tetap menolak ketika jatahnya benar-benar habis", async () => {
    const throttling = limiter(() => ({ success: false }));

    await expect(allowRequest(throttling, "203.0.113.5")).resolves.toEqual({
      allowed: false,
      degraded: false,
    });
  });

  it("meneruskan izin dari limiter yang sehat", async () => {
    const healthy = limiter(() => ({ success: true }));

    await expect(allowRequest(healthy, "203.0.113.5")).resolves.toEqual({
      allowed: true,
      degraded: false,
    });
    expect(healthy.limit).toHaveBeenCalledWith("203.0.113.5");
  });
});
