import { getDictionary } from "@/lib/dictionary";
import NotFoundContent from "@/components/sections/NotFoundContent";

/**
 * Next renders this boundary without route params, so it falls back to the
 * default locale. The catch-all route below it handles locale-aware 404s.
 */
export default async function NotFound() {
  const dict = await getDictionary("en");
  return <NotFoundContent dict={dict.ui.notFound} locale="en" />;
}
