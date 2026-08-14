/**
 * Satu-satunya sumber kebenaran untuk origin situs.
 *
 * Sebelumnya tautan reset password dibangun dari header `origin`/`host` request.
 * Header itu dikendalikan pengirim, jadi request dengan `Host` palsu bisa
 * membuat Supabase mengirim tautan recovery yang mendarat di domain penyerang.
 * Origin tidak boleh datang dari request — resolusinya harus dari environment.
 */

const CANONICAL = "https://dikiachmadp.work";

function resolve(): string {
  // Diset manual (Vercel/produksi). Menang atas semua tebakan di bawah.
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  // Di produksi VERCEL_URL berisi domain per-deployment, bukan domain kustom.
  if (process.env.VERCEL_ENV === "production") return CANONICAL;

  // Preview deploy: domainnya acak dan hanya diketahui saat runtime.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";

  return CANONICAL;
}

export const SITE_URL = resolve();
