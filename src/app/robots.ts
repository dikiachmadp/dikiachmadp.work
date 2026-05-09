import { MetadataRoute } from "next";

const BASE_URL = "https://dikiachmadp.work";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/", // Jangan indeks rute API
        "/_next/", // Jangan indeks file internal Next.js
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
