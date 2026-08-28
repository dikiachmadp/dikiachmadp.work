import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getOrderByToken } from "@/lib/db/orders";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import Receipt from "@/components/documents/Receipt";
import PrintButton from "@/components/documents/PrintButton";
import { Locale } from "@/types/content";

interface ReceiptPageProps {
  params: Promise<{ locale: string; token: string }>;
}

/**
 * Halaman ini berisi alamat email pembeli dan nominal yang dibayarkannya, dan
 * dibuka lewat tautan rahasia. Tidak ada satu pun alasan ia boleh terindeks.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Tidak ada singgahan sama sekali. Dokumen ini dibuka dari tautan di email,
 * kadang berbulan-bulan setelah dibuat; menyajikan salinan lama — atau lebih
 * buruk, salinan milik orang lain yang kebetulan tersimpan di singgahan CDN —
 * adalah kebocoran data, bukan sekadar kesalahan tampilan.
 */
export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { locale, token } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);

  const order = await getOrderByToken(token);

  /**
   * Token yang tidak cocok jatuh ke 404 biasa — sama persis dengan URL yang
   * memang tidak ada. Halaman galat tersendiri yang berbunyi "tanda terima
   * tidak ditemukan" justru memberi tahu penebak bahwa ia sedang menebak di
   * tempat yang benar.
   */
  if (!order) notFound();

  const t = dict.ui.receipt;

  return (
    <PageWrapper>
      <div className="doc-page mx-auto w-full max-w-[720px] px-[22px] pt-11 pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button
            href={`/${validLocale}/products`}
            variant="secondary"
            size="sm"
            className="r-chip px-4 py-2 text-[12px]"
          >
            ← {dict.ui.products.backBtn}
          </Button>
          <PrintButton label={t.printBtn} />
        </div>

        <Receipt order={order} locale={validLocale} ui={dict.ui} />
      </div>
    </PageWrapper>
  );
}
