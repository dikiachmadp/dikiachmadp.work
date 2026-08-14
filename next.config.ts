import type { NextConfig } from "next";

const SUPABASE = "https://*.supabase.co";

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP sekarang ditegakkan (enforcing), bukan lagi report-only.
 *
 * `'unsafe-inline'` di `script-src` sengaja dipertahankan. Membuangnya menuntut
 * nonce, dan menurut dokumen Next (`01-app/02-guides/content-security-policy.md`)
 * nonce mewajibkan SELURUH halaman dirender dinamis — static generation dan ISR
 * mati. Itu membatalkan `revalidate = 3600` di locale layout, seluruh
 * `generateStaticParams`, dan alur `revalidateProjectPaths()`, sekaligus membuat
 * tiap kunjungan memukul Supabase free tier — database yang justru sedang
 * dijaga supaya tidak tertidur. Harganya terlalu mahal untuk situs portofolio;
 * jangan "perbaiki" ini tanpa membaca docs/operations.md lebih dulu.
 *
 * `style-src` tetap butuh `'unsafe-inline'` apa pun yang terjadi: ada puluhan
 * atribut `style` di JSX, dan nonce tidak berlaku untuk atribut style.
 *
 * Yang sudah mengikat: object-src, base-uri, form-action, frame-ancestors, plus
 * connect-src/img-src yang dibatasi ke domain sendiri dan Supabase.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' hanya untuk dev: React memakainya di sana untuk merekonstruksi
  // stack error server di browser. Next dan React tidak memakai eval di produksi.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE}`,
  "media-src 'self'",
  // Pipeline gambar Next memakai worker dari blob URL.
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
