import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getPublishedPosts } from "@/lib/db/logbook";
import { createMetadata } from "@/lib/metadata";
import { pageCount, parsePageParam } from "@/lib/pagination";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Pagination from "@/components/ui/Pagination";
import PostCard from "@/components/logbook/PostCard";
import LogbookSearch from "@/components/logbook/LogbookSearch";
import { Locale } from "@/types/content";

const PER_PAGE = 9;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const header = dict.pageHeader.logbook;

  return createMetadata({
    title: header.title,
    description: header.description,
    path: "/logbook",
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

function firstOf(raw: string | string[] | undefined): string {
  return (Array.isArray(raw) ? raw[0] : raw) ?? "";
}

export default async function LogbookIndexPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { page, q } = await searchParams;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const current = parsePageParam(page);
  const query = firstOf(q).trim();
  const basePath = `/${validLocale}/logbook`;
  // Diteruskan ke Pagination supaya berpindah halaman tidak diam-diam
  // membuang pencarian aktif.
  const extraQuery = query ? { q: query } : undefined;

  const [dict, { posts, total }] = await Promise.all([
    getDictionary(validLocale),
    getPublishedPosts(validLocale, { page: current, perPage: PER_PAGE, query }),
  ]);

  // Halaman di luar jangkauan tampil persis seperti daftar yang benar-benar
  // kosong, jadi dikembalikan ke halaman terakhir yang ada — dengan `q` tetap
  // ikut, atau pencarian yang sedang aktif hilang di tengah jalan. Halaman 1
  // tetap boleh kosong: itu artinya memang belum ada hasil.
  const pages = pageCount(total, PER_PAGE);
  if (current > pages && total > 0) {
    const params = new URLSearchParams(extraQuery);
    if (pages > 1) params.set("page", String(pages));
    const qs = params.toString();
    redirect(qs ? `${basePath}?${qs}` : basePath);
  }

  const header = dict.pageHeader.logbook;
  const t = dict.ui.logbook;

  return (
    <PageWrapper>
      <SectionWrapper id="logbook" spacing="sm">
        <PageHeader
          topTitle={header.topTitle}
          title={header.title}
          description={header.description}
          className="mb-[30px]"
        />

        <LogbookSearch
          basePath={basePath}
          query={query}
          placeholder={dict.ui.states.searchPlaceholderLogbook}
          label={dict.ui.states.searchPlaceholderLogbook}
        />

        {posts.length === 0 ? (
          <p className="ink-border-dashed r-card m-0 bg-(--wash) px-5 py-9 text-center text-[15px] text-(--soft)">
            {query ? dict.ui.states.empty : t.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                locale={validLocale}
                readLabel={t.readPost}
                index={index}
              />
            ))}
          </div>
        )}

        <Pagination
          current={current}
          total={total}
          perPage={PER_PAGE}
          basePath={basePath}
          label={header.title}
          query={extraQuery}
        />
      </SectionWrapper>
    </PageWrapper>
  );
}
