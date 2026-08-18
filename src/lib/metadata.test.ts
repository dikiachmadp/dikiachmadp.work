import { describe, expect, it } from "vitest";
import { createMetadata } from "@/lib/metadata";
import { articleSchema } from "@/lib/structured-data";
import type { SiteConfig } from "@/types/content";

const siteConfig = {
  siteName: "dikiachmadp",
  url: "https://dikiachmadp.work",
  ogImage: "/og.png",
};

const base = {
  title: "A post",
  description: "Short summary",
  path: "/logbook/a-post",
  siteConfig,
  locale: "id" as const,
};

/**
 * `type`, `publishedTime`, `modifiedTime`, dan `image` ditambahkan sebagai
 * parameter opsional supaya seluruh pemanggil lama menghasilkan metadata yang
 * persis sama. Test pertama inilah yang menjaga janji itu.
 */
describe("createMetadata", () => {
  it("still emits a website page exactly as before when nothing extra is passed", () => {
    const meta = createMetadata(base);

    expect(meta.openGraph).toMatchObject({
      type: "website",
      url: "https://dikiachmadp.work/id/logbook/a-post",
      images: [{ url: "https://dikiachmadp.work/og.png" }],
    });
    expect(meta.openGraph).not.toHaveProperty("publishedTime");
  });

  it("marks an article and carries its dates", () => {
    const meta = createMetadata({
      ...base,
      type: "article",
      publishedTime: new Date("2026-08-01T09:00:00.000Z"),
      modifiedTime: new Date("2026-08-02T10:00:00.000Z"),
    });

    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-08-01T09:00:00.000Z",
      modifiedTime: "2026-08-02T10:00:00.000Z",
    });
  });

  // Draf tidak punya tanggal terbit; itu tidak boleh membuat metadata gagal.
  it("omits a missing publish date instead of writing null", () => {
    const meta = createMetadata({
      ...base,
      type: "article",
      publishedTime: null,
      modifiedTime: new Date("2026-08-02T10:00:00.000Z"),
    });

    expect(
      (meta.openGraph as { publishedTime?: string }).publishedTime,
    ).toBeUndefined();
  });

  // Cover pos adalah URL bucket Supabase yang sudah absolut. Menempelkan
  // baseUrl di depannya menghasilkan URL gambar yang rusak di setiap pratinjau
  // tautan.
  it("leaves an absolute per-page image alone", () => {
    const meta = createMetadata({
      ...base,
      image: "https://xyz.supabase.co/storage/v1/object/public/a.png",
    });

    expect(meta.openGraph?.images).toEqual([
      { url: "https://xyz.supabase.co/storage/v1/object/public/a.png" },
    ]);
  });

  it("still resolves a relative per-page image against the site URL", () => {
    const meta = createMetadata({ ...base, image: "/covers/a.webp" });

    expect(meta.openGraph?.images).toEqual([
      { url: "https://dikiachmadp.work/covers/a.webp" },
    ]);
  });

  // Slug Logbook berbeda per bahasa, jadi hreflang yang dirakit dari satu path
  // menunjuk ke halaman yang salah di bahasa lain — dicatat di sini sebagai
  // batasan yang diketahui, bukan sebagai perilaku yang diinginkan.
  it("builds both language alternates from the same path", () => {
    const meta = createMetadata(base);

    expect(meta.alternates?.languages).toEqual({
      "en-US": "https://dikiachmadp.work/en/logbook/a-post",
      "id-ID": "https://dikiachmadp.work/id/logbook/a-post",
    });
  });
});

const fullSiteConfig = {
  siteName: "dikiachmadp",
  url: "https://dikiachmadp.work",
  fullName: "Diki Achmad Prasetya",
  ogImage: "/og.png",
} as unknown as SiteConfig;

describe("articleSchema", () => {
  const post = {
    slug: "sebuah-pos",
    title: "Sebuah pos",
    excerpt: "Ringkasan",
    publishedAt: new Date("2026-08-01T09:00:00.000Z"),
    updatedAt: new Date("2026-08-02T10:00:00.000Z"),
    cover: { url: "https://xyz.supabase.co/a.png" },
  };

  it("describes the post as a dated BlogPosting by the site owner", () => {
    const schema = articleSchema(post, fullSiteConfig, "id");

    expect(schema).toMatchObject({
      "@type": "BlogPosting",
      headline: "Sebuah pos",
      url: "https://dikiachmadp.work/id/logbook/sebuah-pos",
      inLanguage: "id-ID",
      datePublished: "2026-08-01T09:00:00.000Z",
      dateModified: "2026-08-02T10:00:00.000Z",
      author: { "@id": "https://dikiachmadp.work/#person" },
    });
  });

  it("keeps an absolute cover URL absolute", () => {
    const schema = articleSchema(post, fullSiteConfig, "en");

    expect(schema.image).toBe("https://xyz.supabase.co/a.png");
  });

  it("omits the image entirely when the post has no gallery", () => {
    const schema = articleSchema(
      { ...post, cover: null },
      fullSiteConfig,
      "en",
    );

    expect(schema).not.toHaveProperty("image");
  });
});
