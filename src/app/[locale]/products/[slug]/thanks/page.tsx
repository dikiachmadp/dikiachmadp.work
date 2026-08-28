import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import PageWrapper from "@/components/layout/PageWrapper";
import Button from "@/components/ui/Button";
import { Locale } from "@/types/content";

interface ThanksPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * URL-nya membawa `checkout_id` dari Polar dan halamannya tidak punya isi yang
 * berdiri sendiri, jadi tidak ada gunanya diindeks.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Pendaratan setelah checkout selesai.
 *
 * Sengaja tidak memanggil Polar untuk membaca status checkout: file dan
 * tanda terimanya dikirim Polar lewat email, jadi halaman ini tidak menyimpan
 * apa pun yang perlu diverifikasi. Membuatnya statis berarti ia tetap tampil
 * benar walau kredensial Polar sedang bermasalah.
 */
export default async function ThanksPage({ params }: ThanksPageProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);
  const t = dict.ui.products;

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-[640px] px-[22px] pt-11 pb-16">
        <h1 className="font-hand m-center mt-1.5 mb-4 text-[clamp(2.4rem,5.6vw,4.2rem)] leading-none">
          {t.thanksTitle}
        </h1>
        <p className="m-justify mb-[30px] text-[17px] leading-[1.65] text-(--soft)">
          {t.thanksBody}
        </p>
        <Button
          href={`/${validLocale}/products`}
          variant="secondary"
          size="sm"
          className="r-chip px-4 py-2 text-[12px]"
        >
          ← {t.backBtn}
        </Button>
      </div>
    </PageWrapper>
  );
}
