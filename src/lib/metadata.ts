import { Locale } from "@/types/content";
import { Metadata } from "next";

interface MetadataOptions {
  title: string;
  description: string;
  path: string;
  siteConfig: {
    siteName: string;
    url: string;
    ogImage?: string;
  };
  locale: Locale;
  /**
   * Tiga field di bawah ini opsional supaya seluruh pemanggil lama tetap
   * menghasilkan metadata yang persis sama seperti sebelumnya.
   */
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  /**
   * Gambar khusus halaman ini — cover pos Logbook. Boleh absolut (URL bucket
   * Supabase) atau path dari /public. Kalau kosong, jatuh ke `siteConfig.ogImage`.
   */
  image?: string;
}

export const createMetadata = ({
  title,
  description,
  path,
  siteConfig,
  locale,
  type = "website",
  publishedTime,
  modifiedTime,
  image,
}: MetadataOptions): Metadata => {
  const baseUrl = siteConfig.url;
  const fullPath = `/${locale}${path}`;
  const canonicalUrl = `${baseUrl}${fullPath}`;
  // Tanpa ini setiap halaman selain beranda mengirim OG tag tanpa gambar.
  const ogImage = image ?? siteConfig.ogImage;
  const images = ogImage
    ? [{ url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}` }]
    : undefined;

  return {
    // The layout's title.template already appends the site name.
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.siteName}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.siteName,
      ...(type === "article"
        ? {
            type: "article",
            publishedTime: publishedTime?.toISOString(),
            modifiedTime: modifiedTime?.toISOString(),
          }
        : { type: "website" }),
      images,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en-US": `${baseUrl}/en${path}`,
        "id-ID": `${baseUrl}/id${path}`,
      },
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.siteName}`,
      description,
      images,
    },
  };
};
