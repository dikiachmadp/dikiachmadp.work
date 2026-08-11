import { Locale } from "@/types/content";
import { Metadata } from "next";

interface MetadataOptions {
  title: string;
  description: string;
  path: string;
  siteConfig: {
    siteName: string;
    url: string;
  };
  locale: Locale;
}

export const createMetadata = ({
  title,
  description,
  path,
  siteConfig,
  locale,
}: MetadataOptions): Metadata => {
  const baseUrl = siteConfig.url;
  const fullPath = `/${locale}${path}`;
  const canonicalUrl = `${baseUrl}${fullPath}`;

  return {
    // The layout's title.template already appends the site name.
    title,
    description,
    openGraph: {
      title: `${title} | ${siteConfig.siteName}`,
      description,
      url: canonicalUrl,
      siteName: siteConfig.siteName,
      type: "website",
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
    },
  };
};
