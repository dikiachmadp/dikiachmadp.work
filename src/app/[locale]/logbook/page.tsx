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
import { Locale } from "@/types/content";

const PER_PAGE = 9;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
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

export default async function LogbookIndexPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { page } = await searchParams;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const current = parsePageParam(page);

  const [dict, { posts, total }] = await Promise.all([
    getDictionary(validLocale),
    getPublishedPosts(validLocale, { page: current, perPage: PER_PAGE }),
  ]);

  // Halaman di luar jangkauan tampil persis seperti daftar yang benar-benar
  // kosong, jadi dikembalikan ke halaman terakhir yang ada. Halaman 1 tetap
  // boleh kosong: itu artinya memang belum ada pos.
  const pages = pageCount(total, PER_PAGE);
  if (current > pages && total > 0) {
    redirect(`/${validLocale}/logbook${pages > 1 ? `?page=${pages}` : ""}`);
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

        {posts.length === 0 ? (
          <p className="ink-border-dashed r-card m-0 bg-(--wash) px-5 py-9 text-center text-[15px] text-(--soft)">
            {t.empty}
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
          basePath={`/${validLocale}/logbook`}
          label={header.title}
        />
      </SectionWrapper>
    </PageWrapper>
  );
}
