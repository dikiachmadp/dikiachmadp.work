import { MetadataRoute } from "next";

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

  const entries = routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1.0 : 0.8,
    })),
  );

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    ...entries,
  ];
}
