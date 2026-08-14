import type { NextConfig } from "next";

const SUPABASE = "https://*.supabase.co";

/**
 * CSP masih Report-Only.
 *
 * Enforcing sejak awal berisiko mematikan halaman diam-diam: script bootstrap
 * Next, script tema inline dari next-themes, dan atribut `style` di JSX semuanya
 * perlu jalur yang benar dulu. Jalankan report-only, pantau console beberapa
 * hari, baru ganti header-nya jadi `Content-Security-Policy`.
 *
 * `frame-ancestors` tidak menunggu itu — proteksi clickjacking-nya sudah aktif
 * lewat `X-Frame-Options: DENY` di bawah.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' masih dibutuhkan sampai nonce dipasang lewat middleware.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  // Halaman login admin sebelumnya bisa di-iframe situs lain (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Upload gambar project lewat FormData server action.
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dwkzfyiqtbminddhmqra.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
