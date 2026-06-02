import { getDictionary } from "@/lib/dictionary";
import { Locale, FullDictionary } from "@/types/content";
import NotFoundContent from "../not-found";

interface CatchAllNotFoundProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CatchAllNotFound({
  params,
}: CatchAllNotFoundProps) {
  const { locale } = await params;
  const validLocale = (locale === "id" ? "id" : "en") as Locale;

  const dict = (await getDictionary(validLocale)) as FullDictionary;

  return <NotFoundContent dict={dict.ui.notFound} locale={validLocale} />;
}
