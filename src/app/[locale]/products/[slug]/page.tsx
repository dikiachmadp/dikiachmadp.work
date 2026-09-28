import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { getAllProductSlugs, getProductBySlug } from "@/lib/db/products";
import { createMetadata } from "@/lib/metadata";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import Markdown from "@/components/logbook/Markdown";
import ProductLanding from "@/components/product/ProductLanding";
import ProductShowcase from "@/components/product/ProductShowcase";
import ProductAnchorNav from "@/components/product/ProductAnchorNav";
import BuyBox from "@/components/product/BuyBox";
import StickyBuyBar from "@/components/product/StickyBuyBar";
import ClosingCta from "@/components/product/ClosingCta";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, productSchema } from "@/lib/structured-data";
import { Locale } from "@/types/content";
import { priceLabel } from "@/lib/utils";

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
  const price = priceLabel(
    product.price,
    product.currency,
    validLocale,
    t.freeLabel,
  );

  /**
   * Sampul dan galeri jadi satu deret di etalase. Di-dedup karena sampul
   * lazimnya juga gambar pertama galeri — pola yang sama dipakai halaman
   * detail Project.
   */
  const showcaseImages = Array.from(
    new Set([product.coverImage, ...product.gallery].filter(Boolean)),
  ).map((url, index) => ({
    id: url,
    url,
    alt: `${product.title} — ${index + 1}`,
  }));

  // Bilah lengket tidak dirender untuk produk yang memang belum bisa dibeli:
  // tombol yang tidak membawa ke mana-mana lebih buruk daripada tidak ada.
  const isBuyable = Boolean(product.polarProductId || product.buyUrl);

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

      {/* Ruang bawah lebih lega di ponsel: di sana bilah beli berlabuh di
          tepi bawah layar dan akan menutupi baris terakhir halaman. */}
      <div className="mx-auto w-full max-w-[980px] px-[22px] pt-11 pb-[110px] md:pb-16">
        <Button
          href={`/${validLocale}/products`}
          variant="secondary"
          size="sm"
          className="r-chip mb-[26px] px-4 py-2 text-[12px]"
        >
          ← {t.backBtn}
        </Button>

        {/* Etalase dan kartu beli berdampingan, bukan spanduk lebar di atas
            aside sempit. Inilah susunan yang membedakan halaman jualan dari
            halaman tulisan: gambar barangnya dan cara membelinya terlihat
            bersamaan, tanpa perlu menggulir sedikit pun.
            Judul dan ringkasan hidup di dalam kartu beli, bukan sebagai kepala
            halaman — `<h1>`-nya ada di sana. */}
        <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-[1fr_360px]">
          <ProductShowcase
            images={showcaseImages}
            title={product.title}
            ui={dict.ui}
          />
          <BuyBox product={product} locale={validLocale} ui={dict.ui} />
        </div>

        <ProductAnchorNav blocks={product.blocks} label={t.anchorNav} />

        {product.body.trim() !== "" && (
          <div className="mt-9 min-w-0">
            <Markdown className="max-w-none">{product.body}</Markdown>
          </div>
        )}

        <ProductLanding blocks={product.blocks} ui={dict.ui} />

        {isBuyable && (
          <ClosingCta
            title={t.closingTitle}
            price={price}
            label={t.backToBuy}
          />
        )}
      </div>

      {isBuyable && (
        <StickyBuyBar
          title={product.title}
          price={price}
          image={product.coverImage || null}
          label={t.backToBuy}
        />
      )}
    </PageWrapper>
  );
}
