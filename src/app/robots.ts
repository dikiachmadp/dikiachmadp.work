import { MetadataRoute } from "next";

const BASE_URL = "https://dikiachmadp.work";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Route group (admin) tidak muncul di URL, jadi jalurnya /{locale}/...
      disallow: [
        "/api/",
        "/_next/",
        "/en/dashboard",
        "/id/dashboard",
        "/en/login",
        "/id/login",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
