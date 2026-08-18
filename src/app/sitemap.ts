import { MetadataRoute } from "next";
import { getAllPostSlugs } from "@/lib/db/logbook";
import { getAllProjectSlugs } from "@/lib/db/projects";
import { getAllProductSlugs } from "@/lib/db/products";
import { SITE_URL } from "@/lib/site-url";
import { Locale } from "@/types/content";

// Sebelumnya domain produksi ditulis langsung di sini, jadi preview deploy
// menerbitkan sitemap yang menunjuk ke produksi. SITE_URL sudah menangani
// produksi, preview, dan dev — lihat src/lib/site-url.ts.
const BASE_URL = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales: Locale[] = ["en", "id"];
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/projects",
    "/services",
    "/studio",
    "/logbook",
    "/products",
    "/privacy",
    "/legal",
  ];

  // Slug project tidak bergantung locale, jadi satu query cukup untuk kedua
  // bahasa. Slug Logbook dan Digital Product sebaliknya — beda per bahasa,
  // dan pos/produk yang belum diterjemahkan memang tidak ada di bahasa itu,
  // jadi locale-nya ikut terbawa dari query alih-alih dikalikan di sini.
  const [slugs, posts, products] = process.env.SKIP_DB_STATIC_GEN
    ? [[], [], []]
    : await Promise.all([
        getAllProjectSlugs(),
        getAllPostSlugs(),
        getAllProductSlugs(),
      ]);

  const staticEntries = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1.0 : 0.8,
    })),
  );

  const projectEntries = locales.flatMap((locale) =>
    slugs.map((slug) => ({
      url: `${BASE_URL}/${locale}/projects/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  // `lastModified` di sini tanggal asli pos, bukan `new Date()` seperti entri
  // lain — pos yang tidak berubah tidak boleh tampak baru disunting tiap kali
  // sitemap dibuat ulang.
  const postEntries = posts.map((post) => ({
    url: `${BASE_URL}/${post.locale}/logbook/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const productEntries = products.map((product) => ({
    url: `${BASE_URL}/${product.locale}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...projectEntries,
    ...postEntries,
    ...productEntries,
  ];
}
