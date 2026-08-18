import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import {
  getAdjacentPosts,
  getAllPostSlugs,
  getPostBySlug,
} from "@/lib/db/logbook";
import { createMetadata } from "@/lib/metadata";
import { estimateReadingMinutes, fill } from "@/lib/utils";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import JsonLd from "@/components/seo/JsonLd";
import Gallery from "@/components/logbook/Gallery";
import Markdown from "@/components/logbook/Markdown";
import { formatPublishedAt } from "@/components/logbook/PostCard";
import ShareButton from "@/components/logbook/ShareButton";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";
import { Locale } from "@/types/content";

interface PostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  // CI membangun tanpa database; tanpa guard ini `next build` mencoba query.
  if (process.env.SKIP_DB_STATIC_GEN) return [];

  // Slug berbeda per bahasa dan pos boleh hanya ada di satu bahasa, jadi
  // pasangan {locale, slug} datang apa adanya dari query — tidak dikalikan
  // dengan daftar locale seperti di halaman project.
  const posts = await getAllPostSlugs();
  return posts.map(({ locale, slug }) => ({ locale, slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, post] = await Promise.all([
    getDictionary(validLocale),
    getPostBySlug(validLocale, slug),
  ]);

  /**
   * Halaman ini menjawab 200 walau posnya tidak ada — status tidak bisa diubah
   * setelah respons mulai di-stream; lihat catatan panjang di
   * `[locale]/[...not-found]/page.tsx`. Yang menjaga URL semacam ini keluar
   * dari indeks adalah `noindex`, bukan angka statusnya.
   *
   * Di sini jalurnya lebih mudah kena daripada di halaman lain: selain slug
   * yang salah ketik, setiap pos yang belum diterjemahkan punya URL sah di
   * bahasa lain yang berakhir di sini — dan itu URL yang benar-benar dibagikan
   * orang.
   */
  if (!post) {
    return {
      title: dict.ui.logbook.notFoundTitle,
      robots: { index: false, follow: false },
    };
  }

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/logbook/${slug}`,
    siteConfig: dict.siteConfig,
    locale: validLocale,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    image: post.cover?.url,
  });
}

export default async function LogbookPostPage({ params }: PostPageProps) {
  const { locale, slug } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, post] = await Promise.all([
    getDictionary(validLocale),
    getPostBySlug(validLocale, slug),
  ]);

  if (!post) notFound();

  // Tetangga kronologis butuh publishedAt pos ini, jadi menunggu post di atas
  // selesai dulu — tidak bisa ikut Promise.all bersama query yang menghasilkannya.
  const adjacent = post.publishedAt
    ? await getAdjacentPosts(validLocale, post.publishedAt)
    : { prev: null, next: null };

  const t = dict.ui.logbook;
  const publishedAt = formatPublishedAt(post.publishedAt, validLocale);
  const readTime = fill(t.readTime, {
    minutes: estimateReadingMinutes(post.body),
  });
  // Cover naik jadi gambar hero di atas judul; sisanya (kalau ada) tetap
  // tampil di galeri di bawah body — tanpa ini foto yang sama muncul dua kali.
  const restImages = post.images.slice(1);

  return (
    <PageWrapper>
      <JsonLd data={articleSchema(post, dict.siteConfig, validLocale)} />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: dict.siteConfig.siteName, path: `/${validLocale}` },
            {
              name: dict.pageHeader.logbook.title,
              path: `/${validLocale}/logbook`,
            },
            {
              name: post.title,
              path: `/${validLocale}/logbook/${post.slug}`,
            },
          ],
          dict.siteConfig,
        )}
      />

      <article className="mx-auto w-full max-w-[820px] px-[22px] pt-11">
        <Button
          href={`/${validLocale}/logbook`}
          variant="secondary"
          size="sm"
          className="r-chip mb-[26px] px-4 py-2 text-[12px]"
        >
          ← {t.backBtn}
        </Button>

        {post.cover && (
          <div className="ink-border flat-6 relative mb-7 aspect-[16/9] w-full overflow-hidden">
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              fill
              sizes="(max-width: 980px) 100vw, 820px"
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* `justify-center`, not `m-center` — this row is a flex container,
            and text-align has no effect on how flex items are positioned. */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 sm:justify-start">
          {publishedAt && (
            <time
              dateTime={post.publishedAt?.toISOString()}
              className="font-tech block text-[11px] tracking-[0.16em] text-(--soft) uppercase"
            >
              {publishedAt}
            </time>
          )}
          {publishedAt && (
            <span aria-hidden className="text-(--soft)">
              ·
            </span>
          )}
          <span className="font-tech block text-[11px] tracking-[0.16em] text-(--soft) uppercase">
            {readTime}
          </span>
        </div>

        <h1 className="font-hand m-center mt-1.5 mb-4 text-[clamp(2.2rem,5.2vw,3.6rem)] leading-none">
          {post.title}
        </h1>

        <p className="ink-border-dashed r-card m-justify mb-[30px] bg-(--wash) px-5 py-4 text-[17px] leading-[1.65] text-(--soft)">
          {post.excerpt}
        </p>

        {restImages.length > 0 && (
          <>
            <div className="dashed-rule mb-9" />
            <Gallery images={restImages} title={post.title} ui={dict.ui} />
          </>
        )}

        <div className="dashed-rule mb-9" />

        <Markdown className="max-w-none">{post.body}</Markdown>

        <div className="mt-11 flex items-center gap-3 border-t-2 border-dashed border-(--line) pt-7">
          <ShareButton
            title={post.title}
            label={t.share}
            copiedLabel={t.shareCopied}
          />
        </div>

        {(adjacent.prev || adjacent.next) && (
          <nav
            aria-label={`${t.prevPost} / ${t.nextPost}`}
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {adjacent.prev ? (
              <Link
                href={`/${validLocale}/logbook/${adjacent.prev.slug}`}
                className="ink-border flat-3 lift-card-sm r-card block bg-(--paper) p-4"
              >
                <span className="block text-[11px] font-bold tracking-[0.1em] text-(--soft) uppercase">
                  ← {t.prevPost}
                </span>
                <span className="font-hand mt-1 block text-[17px] leading-[1.2]">
                  {adjacent.prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {adjacent.next ? (
              <Link
                href={`/${validLocale}/logbook/${adjacent.next.slug}`}
                className="ink-border flat-3 lift-card-sm r-card-alt block bg-(--paper) p-4 text-right"
              >
                <span className="block text-[11px] font-bold tracking-[0.1em] text-(--soft) uppercase">
                  {t.nextPost} →
                </span>
                <span className="font-hand mt-1 block text-[17px] leading-[1.2]">
                  {adjacent.next.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </article>
    </PageWrapper>
  );
}
