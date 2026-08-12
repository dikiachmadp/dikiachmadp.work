import { MetadataRoute } from "next";
import { getAllProjectSlugs } from "@/lib/db/projects";
import { Locale } from "@/types/content";

const BASE_URL = "https://dikiachmadp.work";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales: Locale[] = ["en", "id"];
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/projects",
    "/services",
    "/studio",
    "/privacy",
    "/legal",
  ];

  // Slug tidak bergantung locale, jadi satu query cukup untuk kedua bahasa.
  const slugs = process.env.SKIP_DB_STATIC_GEN
    ? []
    : await getAllProjectSlugs();

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

  return [...staticEntries, ...projectEntries];
}
