import type { Locale, Project, SiteConfig } from "@/types/content";

/**
 * Structured data (JSON-LD) yang dibaca mesin pencari dan asisten AI.
 *
 * Semua nilainya diambil dari siteConfig dan database, bukan ditulis ulang di
 * sini — supaya tidak ada versi kedua dari nama, deskripsi, atau tautan sosial
 * yang bisa basi diam-diam.
 */

const LANGUAGE: Record<Locale, string> = {
  en: "en-US",
  id: "id-ID",
};

/** coverImage bisa berupa URL Supabase (absolut) atau path lokal dari /public. */
function absoluteUrl(base: string, path: string): string {
  return path.startsWith("http") ? path : `${base}${path}`;
}

/**
 * Satu identitas dipakai berulang di beberapa schema. `@id` membuat Google
 * memperlakukannya sebagai entitas yang sama, bukan tiga orang berbeda.
 */
function personId(siteConfig: SiteConfig): string {
  return `${siteConfig.url}/#person`;
}

export function personSchema(siteConfig: SiteConfig, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId(siteConfig),
    name: siteConfig.fullName,
    alternateName: siteConfig.author,
    jobTitle: siteConfig.tagline,
    description: siteConfig.description,
    email: `mailto:${siteConfig.email}`,
    url: `${siteConfig.url}/${locale}`,
    image: absoluteUrl(siteConfig.url, siteConfig.ogImage),
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.location,
    },
    // Profil resmi di platform lain. Ini yang menyambungkan situs ini dengan
    // identitas yang sama di tempat lain.
    sameAs: Object.values(siteConfig.socials),
  };
}

export function websiteSchema(siteConfig: SiteConfig, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.siteName,
    description: siteConfig.description,
    url: `${siteConfig.url}/${locale}`,
    inLanguage: LANGUAGE[locale],
    publisher: { "@id": personId(siteConfig) },
  };
}

export function projectSchema(
  project: Project,
  siteConfig: SiteConfig,
  locale: Locale,
  /**
   * Label kategori sudah dicari pemanggilnya. Modul ini sengaja tidak
   * mengimpor copy UI — semua nilai di sini datang dari siteConfig dan
   * database, dan `genre` tidak boleh jadi pengecualian yang diam-diam
   * mengunci satu bahasa.
   */
  category: string,
) {
  const url = `${siteConfig.url}/${locale}/projects/${project.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url,
    inLanguage: LANGUAGE[locale],
    dateCreated: project.date,
    genre: category,
    creator: { "@id": personId(siteConfig) },
    ...(project.coverImage && {
      image: absoluteUrl(siteConfig.url, project.coverImage),
    }),
    ...(project.tags.length > 0 && { keywords: project.tags.join(", ") }),
    ...(project.client && {
      sourceOrganization: { "@type": "Organization", name: project.client },
    }),
  };
}

/**
 * Pos Logbook. `BlogPosting`, bukan `CreativeWork` seperti Project: yang
 * membedakan adalah tanggal terbit dan penulis, dan itulah yang dipakai mesin
 * pencari untuk menampilkannya sebagai tulisan bertanggal.
 */
export function articleSchema(
  post: {
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | null;
    updatedAt: Date;
    cover: { url: string } | null;
  },
  siteConfig: SiteConfig,
  locale: Locale,
) {
  const url = `${siteConfig.url}/${locale}/logbook/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url,
    // `mainEntityOfPage` menandai bahwa halaman inilah tulisannya, bukan
    // sekadar halaman yang menyebutkannya.
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: LANGUAGE[locale],
    ...(post.publishedAt && { datePublished: post.publishedAt.toISOString() }),
    dateModified: post.updatedAt.toISOString(),
    author: { "@id": personId(siteConfig) },
    publisher: { "@id": personId(siteConfig) },
    ...(post.cover && {
      image: absoluteUrl(siteConfig.url, post.cover.url),
    }),
  };
}

/** Jejak navigasi yang muncul di bawah judul hasil pencarian. */
export function breadcrumbSchema(
  crumbs: { name: string; path: string }[],
  siteConfig: SiteConfig,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${siteConfig.url}${crumb.path}`,
    })),
  };
}
