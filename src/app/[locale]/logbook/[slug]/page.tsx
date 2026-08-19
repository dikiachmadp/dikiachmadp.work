import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import {
  getAdjacentPosts,
  getAllPostSlugs,
  getLogNumber,
  getPostBySlug,
} from "@/lib/db/logbook";
import { createMetadata } from "@/lib/metadata";
import { estimateReadingMinutes, fill } from "@/lib/utils";
import { extractTakeaways } from "@/lib/logbook-takeaways";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import JsonLd from "@/components/seo/JsonLd";
import Gallery from "@/components/logbook/Gallery";
import Markdown from "@/components/logbook/Markdown";
import ReadingRail from "@/components/logbook/ReadingRail";
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

  // Tetangga kronologis dan nomor log keduanya butuh publishedAt pos ini,
  // jadi menunggu post di atas selesai dulu — tidak bisa ikut Promise.all
  // bersama query yang menghasilkannya. `getPostBySlug` selalu memfilter
  // pos terbit, jadi publishedAt di sini tidak pernah null di praktiknya;
  // guard-nya tetap ada karena tipenya `Date | null`.
  const [adjacent, logNumber] = post.publishedAt
    ? await Promise.all([
        getAdjacentPosts(validLocale, post.publishedAt),
        getLogNumber(validLocale, post.publishedAt),
      ])
    : ([{ prev: null, next: null }, 1] as const);

  const t = dict.ui.logbook;
  const publishedAt = formatPublishedAt(post.publishedAt, validLocale);
  const readTime = fill(t.readTime, {
    minutes: estimateReadingMinutes(post.body),
  });
  const logLabel = fill(t.logBadge, { n: String(logNumber).padStart(3, "0") });
  const endOfLogLabel = fill(t.endOfLog, {
    n: String(logNumber).padStart(3, "0"),
  });

  // "What I Learned" adalah panel opsional: pos yang menutup badannya dengan
  // heading + daftar yang cocok dengan `t.whatILearnedHeading` mendapatkan
  // panelnya diangkat keluar dari badan tulisan; yang lain tidak berubah.
  const { body, items: takeaways } = extractTakeaways(
    post.body,
    t.whatILearnedHeading,
  );

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

      <ReadingRail logNumber={logNumber}>
        <article className="mx-auto w-full max-w-[820px] px-[22px] pt-11">
          <Button
            href={`/${validLocale}/logbook`}
            variant="secondary"
            size="sm"
            className="r-chip mb-[26px] px-4 py-2 text-[12px]"
          >
            ← {t.backBtn}
          </Button>

          <div className="mb-4.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
            <span className="r-tag bg-(--accent) px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-white uppercase">
              {logLabel}
            </span>
            {publishedAt && (
              <time
                dateTime={post.publishedAt?.toISOString()}
                className="font-tech block text-[11px] tracking-[0.16em] text-(--soft) uppercase"
              >
                {publishedAt}
              </time>
            )}
            {publishedAt && (
              <span
                aria-hidden
                className="h-1.5 w-1.5 rotate-45 bg-(--ink) opacity-35"
              />
            )}
            <span className="font-tech block text-[11px] tracking-[0.16em] text-(--soft) uppercase">
              {readTime}
            </span>
          </div>

          <h1 className="font-hand m-center mt-1.5 mb-4 text-[clamp(2.2rem,5.2vw,3.6rem)] leading-none">
            <span
              style={{
                backgroundImage:
                  "linear-gradient(transparent 62%, color-mix(in srgb, var(--accent-ink) 26%, transparent) 62%, color-mix(in srgb, var(--accent-ink) 26%, transparent) 94%, transparent 94%)",
              }}
            >
              {post.title}
            </span>
          </h1>

          <p className="m-justify mb-[30px] border-l-[3px] border-(--accent-ink) pl-5 text-[20px] leading-[1.7] text-(--ink)">
            {post.excerpt}
          </p>

          <Gallery
            images={post.images}
            title={post.title}
            ui={dict.ui}
            dateLabel={publishedAt}
          />

          <div className="dashed-rule mb-9" />

          <Markdown className="max-w-none">{body}</Markdown>

          {takeaways.length > 0 && (
            <section className="r-panel flat-6 ink-border mt-[46px] bg-(--wash) px-8 py-[30px]">
              <span className="font-note block text-[21px] leading-[1.1] text-(--soft)">
                {t.whatILearnedEyebrow}
              </span>
              <h2 className="font-hand mt-1 mb-5 text-[clamp(1.5rem,3.5vw,1.9rem)] leading-[1.2]">
                {t.whatILearnedHeading}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {takeaways.map((item) => (
                  <li
                    key={item}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3.5"
                  >
                    <span
                      aria-hidden
                      className="mt-2.5 h-2.5 w-2.5 rotate-45 bg-(--accent-ink)"
                    />
                    <span className="m-justify text-[16px] leading-[1.75]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-9 flex items-center gap-3">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rotate-45 bg-(--accent-ink)"
            />
            <span className="font-note text-[20px] text-(--soft)">
              {endOfLogLabel}
            </span>
            <span className="dashed-rule flex-1" />
          </div>

          <div className="mt-[30px] flex flex-wrap items-center gap-3 border-t-2 border-dashed border-(--line) pt-7">
            <ShareButton
              title={post.title}
              label={t.share}
              copiedLabel={t.shareCopied}
            />
            <Button
              href={`/${validLocale}/logbook`}
              variant="secondary"
              size="sm"
            >
              {t.viewAll} →
            </Button>
            <span className="font-note ml-auto text-[19px] text-(--soft)">
              {t.nextEntrySoon}
            </span>
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
      </ReadingRail>
    </PageWrapper>
  );
}
