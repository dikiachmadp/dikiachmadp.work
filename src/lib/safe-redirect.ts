/**
 * Validasi tujuan redirect yang berasal dari query string.
 *
 * `/auth/callback?next=...` menyalakan sesi lebih dulu, baru mengarahkan. Kalau
 * `next` diterima mentah, `?next=//evil.com` menghasilkan `https://situs//evil.com`
 * — browser membacanya sebagai URL protocol-relative dan pergi ke domain lain,
 * tepat setelah pengguna diyakinkan bahwa tautannya sah. Jadi allowlist bentuk,
 * bukan blocklist: hanya path internal berawalan locale yang lolos.
 */

const LOCALES = ["en", "id"] as const;

// Tanpa titik, backslash, atau karakter skema — jadi URL absolut, `//host`,
// dan `/\host` semuanya gugur tanpa perlu dicek satu per satu.
const INTERNAL_PATH = new RegExp(
  `^/(${LOCALES.join("|")})(/[A-Za-z0-9\\-_/]*)?$`,
);

export function safeNext(
  raw: string | null | undefined,
  locale: string,
): string {
  const fallback = `/${locale}/dashboard`;
  if (!raw) return fallback;
  return INTERNAL_PATH.test(raw) ? raw : fallback;
}
