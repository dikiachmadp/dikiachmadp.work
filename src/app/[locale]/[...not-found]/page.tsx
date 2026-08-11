import { getDictionary } from "@/lib/dictionary";
import { Locale } from "@/types/content";
import NotFoundContent from "@/components/sections/NotFoundContent";

interface CatchAllNotFoundProps {
  params: Promise<{ locale: string }>;
}

export default async function CatchAllNotFound({
  params,
}: CatchAllNotFoundProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;
  const dict = await getDictionary(validLocale);

  return <NotFoundContent dict={dict.ui.notFound} locale={validLocale} />;
}
