import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getPublishedProducts } from "@/lib/db/products";
import { createMetadata } from "@/lib/metadata";
import { pageCount, parsePageParam } from "@/lib/pagination";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Pagination from "@/components/ui/Pagination";
import ProductCard from "@/components/ui/ProductCard";
import SearchForm from "@/components/ui/SearchForm";
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
  const header = dict.pageHeader.products;

  return createMetadata({
    title: header.title,
    description: header.description,
    path: "/products",
    siteConfig: dict.siteConfig,
    locale: validLocale,
  });
}

function firstOf(raw: string | string[] | undefined): string {
  return (Array.isArray(raw) ? raw[0] : raw) ?? "";
}

export default async function ProductsIndexPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { page, q } = await searchParams;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const current = parsePageParam(page);
  const query = firstOf(q).trim();
  const basePath = `/${validLocale}/products`;
  const extraQuery = query ? { q: query } : undefined;

  const [dict, { products, total }] = await Promise.all([
    getDictionary(validLocale),
    getPublishedProducts(validLocale, {
      page: current,
      perPage: PER_PAGE,
      query,
    }),
  ]);

  // Sama seperti /logbook: halaman di luar jangkauan kembali ke halaman
  // terakhir yang ada, dengan `q` tetap ikut.
  const pages = pageCount(total, PER_PAGE);
  if (current > pages && total > 0) {
    const params = new URLSearchParams(extraQuery);
    if (pages > 1) params.set("page", String(pages));
    const qs = params.toString();
    redirect(qs ? `${basePath}?${qs}` : basePath);
  }

  const header = dict.pageHeader.products;
  const t = dict.ui.products;

  return (
    <PageWrapper>
      <SectionWrapper id="products" spacing="sm">
        <PageHeader
          topTitle={header.topTitle}
          title={header.title}
          description={header.description}
          className="mb-[30px]"
        />

        <SearchForm
          basePath={basePath}
          query={query}
          placeholder={dict.ui.states.searchPlaceholderProducts}
          label={dict.ui.states.searchPlaceholderProducts}
        />

        {products.length === 0 ? (
          <p className="ink-border-dashed r-card m-0 bg-(--wash) px-5 py-9 text-center text-[15px] text-(--soft)">
            {query ? dict.ui.states.empty : t.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={validLocale}
                ui={dict.ui}
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
