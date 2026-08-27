import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { getAllProductSlugs, getProductBySlug } from "@/lib/db/products";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Markdown from "@/components/logbook/Markdown";
import BuyPanel from "@/components/products/BuyPanel";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, productSchema } from "@/lib/structured-data";
import { Locale } from "@/types/content";
import { cn, formatPrice } from "@/lib/utils";

interface ProductDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  // CI membangun tanpa database; tanpa guard ini `next build` mencoba query.
  if (process.env.SKIP_DB_STATIC_GEN) return [];

  // Slug berbeda per bahasa dan produk boleh hanya ada di satu bahasa, jadi
  // pasangan {locale, slug} datang apa adanya dari query — sama seperti Logbook.
  const slugs = await getAllProductSlugs();
  return slugs.map(({ locale, slug }) => ({ locale, slug }));
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, product] = await Promise.all([
    getDictionary(validLocale),
    getProductBySlug(validLocale, slug),
  ]);

  /**
   * Halaman ini menjawab 200 walau produknya tidak ada — status tidak bisa
   * diubah setelah respons mulai di-stream. `noindex`, bukan angka status,
   * yang menjaga URL semacam ini keluar dari indeks. Lihat catatan yang sama
   * di halaman detail Project dan Logbook.
   */
  if (!product) {
    return {
      title: dict.ui.products.notFoundTitle,
      robots: { index: false, follow: false },
    };
  }

  return createMetadata({
    title: product.title,
    description: product.summary,
    path: `/products/${slug}`,
    siteConfig: dict.siteConfig,
    locale: validLocale,
    image: product.coverImage || undefined,
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { locale, slug } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const [dict, product] = await Promise.all([
    getDictionary(validLocale),
    getProductBySlug(validLocale, slug),
  ]);

  if (!product) notFound();

  const t = dict.ui.products;
  const hasCover = Boolean(product.coverImage);
  const price = formatPrice(product.price, product.currency, validLocale);

  const productsLabel =
    dict.navigation.main.find((item) => item.path === "/products")?.label ??
    dict.pageHeader.products.title;

  return (
    <PageWrapper>
      <JsonLd data={productSchema(product, dict.siteConfig, validLocale)} />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: dict.siteConfig.siteName, path: `/${validLocale}` },
            { name: productsLabel, path: `/${validLocale}/products` },
            {
              name: product.title,
              path: `/${validLocale}/products/${product.slug}`,
            },
          ],
          dict.siteConfig,
        )}
      />

      <div className="mx-auto w-full max-w-[980px] px-[22px] pt-11">
        <Button
          href={`/${validLocale}/products`}
          variant="secondary"
          size="sm"
          className="r-chip mb-[26px] px-4 py-2 text-[12px]"
        >
          ← {t.backBtn}
        </Button>

        <h1 className="font-hand m-center mt-1.5 mb-4 text-[clamp(2.4rem,5.6vw,4.2rem)] leading-none">
          {product.title}
        </h1>
        <p className="m-justify mb-[30px] max-w-[640px] text-[17px] leading-[1.65] text-(--soft)">
          {product.summary}
        </p>

        <div className="r-frame ink-border flat-5 mb-[34px] bg-(--wash) p-2.5">
          <div
            className={cn(
              "r-frame-inner ink-border relative flex aspect-video items-center justify-center overflow-hidden",
              !hasCover && "crosshatch",
            )}
          >
            {hasCover ? (
              <Image
                src={product.coverImage}
                alt={product.title}
                fill
                sizes="(max-width: 980px) 100vw, 960px"
                priority
                className="object-contain"
              />
            ) : (
              <span className="font-tech text-[11px] tracking-[0.2em] text-(--soft) uppercase">
                {product.title}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-[1fr_260px]">
          <Markdown className="max-w-none">{product.body}</Markdown>

          <aside className="r-card-alt ink-border flat-3 flex flex-col gap-3.5 bg-(--paper) p-5">
            {price && (
              <div>
                <div className="micro">
                  {validLocale === "id" ? "Harga" : "Price"}
                </div>
                <div className="font-hand mt-0.5 text-[26px] leading-[1.2]">
                  {price}
                </div>
              </div>
            )}

            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Tag key={tag} className="px-3 py-[5px]">
                    {tag}
                  </Tag>
                ))}
              </div>
            )}

            <div className="h-0.5 bg-(--line) opacity-25" />

            <BuyPanel
              slug={product.slug}
              locale={validLocale}
              labels={t}
              polarProductId={product.polarProductId}
              buyUrl={product.buyUrl}
              pwywEnabled={product.pwywEnabled}
              pwywMinAmount={product.pwywMinAmount}
            />
          </aside>
        </div>

        {product.gallery.length > 0 && (
          <div className="mt-11">
            <h2 className="font-hand mb-4 text-[28px]">{t.galleryLabel}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {product.gallery.map((src, i) => (
                <div
                  key={src}
                  className="r-card ink-border relative aspect-[4/3] overflow-hidden bg-(--wash) transition-all duration-[0.25s] ease-out hover:-translate-x-[3px] hover:-translate-y-[3px] hover:rotate-[-0.8deg] hover:shadow-[6px_6px_0_var(--line)]"
                >
                  <Image
                    src={src}
                    alt={`${product.title} — ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
