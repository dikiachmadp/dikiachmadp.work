import { MetadataRoute } from "next";
import { getDictionary } from "@/lib/dictionary";
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

  const projectsData = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      projects: (await getDictionary(locale)).projects.items,
    })),
  );

  const staticEntries = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1.0 : 0.8,
    })),
  );

  const projectEntries = projectsData.flatMap(({ locale, projects }) =>
    projects.map((project) => ({
      url: `${BASE_URL}/${locale}/projects/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  return [...staticEntries, ...projectEntries];
}
