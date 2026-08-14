import { MetadataRoute } from "next";
import enSiteConfig from "@/content/en/siteConfig.json";

/**
 * Web app manifest. `public/icon-192.png` sudah lama ada di repo tapi tidak
 * pernah dirujuk apa pun — tanpa manifest, menambahkan situs ini ke layar utama
 * memakai tangkapan layar seadanya, bukan ikonnya.
 *
 * Manifest berlaku untuk seluruh origin, jadi tidak bisa per-locale. Bahasa
 * default situs dipakai di sini; `start_url` mengarah ke locale default yang
 * sama dengan `defaultLocale` di src/proxy.ts.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${enSiteConfig.siteName} — ${enSiteConfig.fullName}`,
    short_name: enSiteConfig.siteName,
    description: enSiteConfig.description,
    start_url: "/en",
    display: "standalone",
    // Sepadan dengan --paper dan --accent di globals.css.
    background_color: "#fbfaf6",
    theme_color: "#0d7c6f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  };
}
