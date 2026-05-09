import { MetadataRoute } from "next";

/**
 * Pastikan Anda mengganti URL ini dengan domain asli Anda nanti.
 */
const BASE_URL = "https://dikiachmadp.work";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "id"];
  const routes = [
    "",
    "/about",
    "/contact",
    "/projects",
    "/services",
    "/studio",
    "/privacy",
    "/legal",
  ];

  // Membuat entri sitemap untuk setiap rute dan setiap bahasa
  const entries = routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1.0 : 0.8, // Halaman utama memiliki prioritas tertinggi
    })),
  );

  return entries;
}
