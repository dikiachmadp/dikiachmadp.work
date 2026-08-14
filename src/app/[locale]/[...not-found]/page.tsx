import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { Locale } from "@/types/content";
import NotFoundContent from "@/components/sections/NotFoundContent";

interface CatchAllNotFoundProps {
  params: Promise<{ locale: string }>;
}

/**
 * Rute ini menjawab 200, bukan 404 — dan itu tidak bisa diubah dari sini.
 * Begitu respons mulai di-stream (dan `loading.tsx` di segmen induk memicunya),
 * header sudah terkirim sehingga status tidak bisa lagi diubah; lihat
 * `01-app/03-api-reference/03-file-conventions/loading.md` bagian Status Codes.
 *
 * Yang mencegah URL sampah masuk indeks adalah `noindex`, bukan angka status —
 * dokumen yang sama menyatakannya. Sebelum ini halaman 404 menjawab 200 tanpa
 * noindex sama sekali, jadi setiap URL keliru bisa terindeks sebagai halaman
 * sungguhan.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CatchAllNotFound({
  params,
}: CatchAllNotFoundProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);

  return <NotFoundContent dict={dict.ui.notFound} locale={validLocale} />;
}
