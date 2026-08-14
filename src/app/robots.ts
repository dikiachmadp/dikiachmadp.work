import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

const locales = ["en", "id"];

// Route group (admin) tidak muncul di URL, jadi jalurnya /{locale}/...
// Selain dasbor, semua jalur auth ikut ditutup: halaman reset password membawa
// token pemulihan di URL-nya, dan itu tidak boleh mendarat di indeks pencarian.
const adminPaths = [
  "dashboard",
  "login",
  "forgot-password",
  "reset-password",
  "auth",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/_next/",
        ...locales.flatMap((locale) =>
          adminPaths.map((path) => `/${locale}/${path}`),
        ),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
