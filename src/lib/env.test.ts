import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const required = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/dummy",
  ADMIN_EMAILS: "admin@example.com",
  RESEND_API_KEY: "re_dummy",
  CONTACT_EMAIL: "admin@example.com",
  UPSTASH_REDIS_REST_URL: "https://dummy.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "dummy-token",
};

const original = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...original, ...required };
});

afterEach(() => {
  process.env = original;
});

async function loadEnv() {
  return (await import("@/lib/env")).env;
}

describe("variabel opsional yang ditulis tanpa nilai", () => {
  /**
   * Regresi: `.optional()` hanya memaafkan `undefined`, bukan string kosong.
   * Menyalin .env.example apa adanya menghasilkan `POLAR_ACCESS_TOKEN=`, dan
   * karena modul ini melempar saat di-import, satu baris kosong itu sempat
   * menjatuhkan seluruh situs demi fitur yang justru dirancang opsional.
   */
  it("does not throw when the Polar variables are present but empty", async () => {
    process.env.POLAR_ACCESS_TOKEN = "";
    process.env.POLAR_WEBHOOK_SECRET = "";
    process.env.POLAR_SERVER = "";

    const env = await loadEnv();

    expect(env.POLAR_ACCESS_TOKEN).toBeUndefined();
    expect(env.POLAR_WEBHOOK_SECRET).toBeUndefined();
    // Baris kosong jatuh ke default, bukan menggagalkan enum.
    expect(env.POLAR_SERVER).toBe("production");
  });

  it("treats whitespace as unset too", async () => {
    process.env.POLAR_ACCESS_TOKEN = "   ";

    expect((await loadEnv()).POLAR_ACCESS_TOKEN).toBeUndefined();
  });

  it("reads real values when they are set", async () => {
    process.env.POLAR_ACCESS_TOKEN = "polar_oat_x";
    process.env.POLAR_SERVER = "sandbox";

    const env = await loadEnv();

    expect(env.POLAR_ACCESS_TOKEN).toBe("polar_oat_x");
    expect(env.POLAR_SERVER).toBe("sandbox");
  });

  it("defaults POLAR_SERVER to production when absent entirely", async () => {
    delete process.env.POLAR_SERVER;

    expect((await loadEnv()).POLAR_SERVER).toBe("production");
  });

  it("still rejects a missing required variable", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(loadEnv()).rejects.toThrow(/RESEND_API_KEY/);
  });
});
